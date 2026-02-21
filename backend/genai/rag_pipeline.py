import json
import os
import re
from typing import List, Dict
from collections import Counter
import math

# ChromaDB for dense vector search
import chromadb

# BM25 Sparse Search Implementation
class BM25:
    """Simple BM25 implementation for sparse keyword-based retrieval."""
    def __init__(self, corpus: List[str], k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus = corpus
        self.doc_len = [len(doc.split()) for doc in corpus]
        self.avgdl = sum(self.doc_len) / len(self.doc_len) if self.doc_len else 1
        self.N = len(corpus)
        
        # Build inverted index
        self.df = Counter()
        self.tf = []
        for doc in corpus:
            words = doc.lower().split()
            self.tf.append(Counter(words))
            self.df.update(set(words))
    
    def score(self, query: str) -> List[float]:
        query_terms = query.lower().split()
        scores = []
        for i, doc in enumerate(self.corpus):
            s = 0.0
            for term in query_terms:
                if term not in self.df:
                    continue
                idf = math.log((self.N - self.df[term] + 0.5) / (self.df[term] + 0.5) + 1)
                tf = self.tf[i].get(term, 0)
                numerator = tf * (self.k1 + 1)
                denominator = tf + self.k1 * (1 - self.b + self.b * self.doc_len[i] / self.avgdl)
                s += idf * (numerator / denominator)
            scores.append(s)
        return scores


class HybridRAGPipeline:
    """
    Hybrid Retrieval-Augmented Generation Pipeline.
    Combines BM25 (sparse keyword search) + ChromaDB (dense vector search)
    using Reciprocal Rank Fusion for optimal recall.
    """
    def __init__(self, knowledge_base_path: str = None):
        if knowledge_base_path is None:
            knowledge_base_path = os.path.join(
                os.path.dirname(__file__), "knowledge_base", "seed_data.json"
            )
        
        # Load seed data
        with open(knowledge_base_path, "r") as f:
            self.documents = json.load(f)
        
        # Build corpus text
        self.corpus = [f"{d['title']} {d['content']}" for d in self.documents]
        
        # BM25 Sparse Index
        self.bm25 = BM25(self.corpus)
        
        # ChromaDB Dense Index
        self.chroma_client = chromadb.Client()
        self.collection = self.chroma_client.get_or_create_collection(
            name="symbios_knowledge",
            metadata={"hnsw:space": "cosine"}
        )
        
        # Seed ChromaDB (idempotent — checks if already exists)
        existing = self.collection.count()
        if existing == 0:
            self.collection.add(
                documents=self.corpus,
                ids=[d["id"] for d in self.documents],
                metadatas=[{
                    "title": d["title"],
                    "feasibility": str(d["feasibility_score"]),
                    "risk": d["risk_level"]
                } for d in self.documents]
            )
    
    def reciprocal_rank_fusion(self, bm25_ranking: List[int], chroma_ranking: List[str], k: int = 60) -> List[str]:
        """
        Merge two ranked lists using RRF.
        Formula: score(d) = sum( 1 / (k + rank(d)) ) across all lists
        """
        rrf_scores = {}
        
        # BM25 ranking (indices)
        for rank, idx in enumerate(bm25_ranking):
            doc_id = self.documents[idx]["id"]
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0) + 1.0 / (k + rank + 1)
        
        # ChromaDB ranking (doc ids)
        for rank, doc_id in enumerate(chroma_ranking):
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0) + 1.0 / (k + rank + 1)
        
        # Sort by RRF score descending
        sorted_docs = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
        return [doc_id for doc_id, _ in sorted_docs]
    
    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Hybrid retrieve: BM25 + ChromaDB, merged via RRF.
        Returns top_k documents with metadata.
        """
        # BM25 sparse search
        bm25_scores = self.bm25.score(query)
        bm25_ranking = sorted(range(len(bm25_scores)), key=lambda i: bm25_scores[i], reverse=True)[:top_k * 2]
        
        # ChromaDB dense search
        chroma_results = self.collection.query(
            query_texts=[query],
            n_results=min(top_k * 2, self.collection.count())
        )
        chroma_ranking = chroma_results["ids"][0] if chroma_results["ids"] else []
        
        # Reciprocal Rank Fusion
        fused_ids = self.reciprocal_rank_fusion(bm25_ranking, chroma_ranking)[:top_k]
        
        # Fetch full docs
        results = []
        doc_map = {d["id"]: d for d in self.documents}
        for doc_id in fused_ids:
            if doc_id in doc_map:
                results.append(doc_map[doc_id])
        
        return results
    
    def generate_context(self, query: str, top_k: int = 3) -> str:
        """Build a context string from retrieved documents for LLM prompting."""
        docs = self.retrieve(query, top_k)
        context_parts = []
        for i, doc in enumerate(docs, 1):
            context_parts.append(
                f"[Source {i}: {doc['title']}]\n"
                f"{doc['content']}\n"
                f"Feasibility: {doc['feasibility_score']}, Risk: {doc['risk_level']}\n"
                f"Citation: {doc['source']}\n"
            )
        return "\n".join(context_parts)
