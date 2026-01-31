import re
from typing import List, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class DuplicateDetector:
    def __init__(self, similarity_threshold: float = 0.7):
        self.similarity_threshold = similarity_threshold
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1
        )
    
    def preprocess_text(self, text: str) -> str:
        """Clean and preprocess text for better similarity matching"""
        # Convert to lowercase
        text = text.lower()
        # Remove special characters but keep spaces
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def extract_keywords(self, text: str, top_n: int = 10) -> List[str]:
        """
        Extract top keywords from text using TF-IDF.
        Useful for highlighting matching keywords in UI.
        
        Args:
            text: Input text
            top_n: Number of top keywords to return
        
        Returns:
            List of top keywords
        """
        processed_text = self.preprocess_text(text)
        if not processed_text:
            return []
        
        try:
            vectorizer = TfidfVectorizer(
                max_features=top_n,
                stop_words='english',
                ngram_range=(1, 2)
            )
            tfidf_matrix = vectorizer.fit_transform([processed_text])
            feature_names = vectorizer.get_feature_names_out()
            
            # Get top keywords by TF-IDF score
            scores = tfidf_matrix.toarray()[0]
            keyword_scores = list(zip(feature_names, scores))
            keyword_scores.sort(key=lambda x: x[1], reverse=True)
            
            return [word for word, score in keyword_scores[:top_n] if score > 0]
        except Exception:
            return []
    
    def find_matching_keywords(self, text1: str, text2: str) -> List[str]:
        """
        Find common keywords between two texts.
        Used for highlighting matching terms in duplicate detection UI.
        
        Args:
            text1: First text
            text2: Second text
        
        Returns:
            List of matching keywords
        """
        keywords1 = set(self.extract_keywords(text1))
        keywords2 = set(self.extract_keywords(text2))
        return list(keywords1.intersection(keywords2))
    
    def detect_duplicates(
        self, 
        new_issue_text: str, 
        existing_issues: List[Dict]
    ) -> Dict:
        """
        Detect if a new issue is similar to existing issues
        
        Args:
            new_issue_text: Combined title + description of new issue
            existing_issues: List of existing issues with 'title' and 'description'
        
        Returns:
            Dict with is_duplicate, similarity_score, and similar_issues
        """
        if not existing_issues:
            return {
                "is_duplicate": False,
                "similarity_score": 0.0,
                "similar_issues": []
            }
        
        # Preprocess new issue
        new_text = self.preprocess_text(new_issue_text)
        
        # Combine title and description for existing issues
        existing_texts = []
        for issue in existing_issues:
            combined = f"{issue.get('title', '')} {issue.get('description', '')}"
            existing_texts.append(self.preprocess_text(combined))
        
        # Add new text to the list for vectorization
        all_texts = existing_texts + [new_text]
        
        try:
            # Create TF-IDF vectors
            tfidf_matrix = self.vectorizer.fit_transform(all_texts)
            
            # Get the vector for the new issue (last one)
            new_issue_vector = tfidf_matrix[-1]
            
            # Calculate cosine similarity with all existing issues
            similarities = cosine_similarity(
                new_issue_vector,
                tfidf_matrix[:-1]  # All except the last one
            )[0]
            
            # Find issues above threshold
            similar_indices = np.where(similarities >= self.similarity_threshold)[0]
            
            similar_issues = []
            max_similarity = 0.0
            
            for idx in similar_indices:
                similarity_score = float(similarities[idx])
                max_similarity = max(max_similarity, similarity_score)
                
                issue_data = existing_issues[idx]
                existing_text = f"{issue_data.get('title', '')} {issue_data.get('description', '')}"
                matching_keywords = self.find_matching_keywords(new_issue_text, existing_text)
                
                similar_issues.append({
                    "id": str(issue_data.get("_id", "")),
                    "title": issue_data.get("title", ""),
                    "description": issue_data.get("description", "")[:200] + "...",
                    "status": issue_data.get("status", ""),
                    "similarity_score": round(similarity_score, 3),
                    "similarity_percentage": round(similarity_score * 100, 1),
                    "matching_keywords": matching_keywords[:5]  # Top 5 matching keywords
                })
            
            # Sort by similarity score (descending)
            similar_issues.sort(key=lambda x: x["similarity_score"], reverse=True)
            
            return {
                "is_duplicate": len(similar_issues) > 0,
                "similarity_score": round(max_similarity, 3) if max_similarity > 0 else 0.0,
                "similar_issues": similar_issues[:5]  # Return top 5 most similar
            }
            
        except Exception as e:
            # If vectorization fails, return no duplicates
            print(f"Error in duplicate detection: {e}")
            return {
                "is_duplicate": False,
                "similarity_score": 0.0,
                "similar_issues": []
            }

# Global instance
duplicate_detector = DuplicateDetector(similarity_threshold=0.7)
