"""
Keyword-Based Expense Classifier (Fallback Method)
Uses predefined keywords to categorize receipts when LLM is unavailable
"""

import re
from typing import Dict, List, Optional


class KeywordClassifier:
    """
    Classifies expenses based on keywords in vendor name and line items.
    Used as fallback when LLM categorization is unavailable.
    """
    
    # Define category keywords (order matters - more specific first)
    CATEGORIES = {
        'food': [
            # Food delivery & restaurants
            'swiggy', 'zomato', 'uber eats', 'doordash', 'grubhub',
            'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'mcdonald',
            'kfc', 'domino', 'subway', 'starbucks', 'dunkin',
            # Food items
            'food', 'meal', 'breakfast', 'lunch', 'dinner', 'snack',
            'grocery', 'supermarket', 'bakery', 'deli', 'cuisine',
            # Indian
            'biryani', 'curry', 'dosa', 'idli', 'paratha', 'roti',
        ],
        'travel': [
            # Ride sharing & taxis
            'uber', 'ola', 'lyft', 'taxi', 'cab', 'rapido',
            # Transportation
            'flight', 'airline', 'airways', 'airport', 'rail', 'railway',
            'train', 'bus', 'metro', 'transit',
            # Accommodation
            'hotel', 'motel', 'airbnb', 'hostel', 'resort', 'lodge',
            # Fuel
            'petrol', 'diesel', 'fuel', 'gas station', 'shell', 'bp',
        ],
        'entertainment': [
            # Streaming & subscriptions
            'netflix', 'spotify', 'prime video', 'disney', 'hulu',
            'youtube premium', 'apple music', 'hotstar',
            # Events & venues
            'movie', 'cinema', 'theater', 'theatre', 'concert', 'show',
            'game', 'gaming', 'xbox', 'playstation', 'steam',
            # Activities
            'entertainment', 'amusement', 'park', 'zoo', 'museum',
        ],
        'utilities': [
            # Bills
            'electricity', 'electric', 'power', 'energy',
            'water', 'gas', 'sewage', 'garbage', 'waste',
            # Telecom
            'internet', 'broadband', 'wifi', 'phone', 'mobile',
            'telecom', 'airtel', 'jio', 'vodafone', 'idea',
            # Services
            'utility', 'bill payment',
        ],
        'supplies': [
            # Office supplies
            'office', 'stationery', 'paper', 'printer', 'ink', 'toner',
            'stapler', 'pen', 'pencil', 'notebook',
            # Online shopping
            'amazon', 'flipkart', 'ebay', 'walmart', 'target',
            'online', 'shopping', 'ecommerce',
            # General
            'supplies', 'equipment', 'hardware', 'software',
        ],
        'health': [
            # Medical
            'hospital', 'clinic', 'doctor', 'medical', 'pharmacy',
            'medicine', 'drug', 'prescription', 'health',
            # Wellness
            'gym', 'fitness', 'yoga', 'spa', 'massage', 'salon',
        ],
        'education': [
            'school', 'college', 'university', 'course', 'training',
            'tuition', 'education', 'learning', 'udemy', 'coursera',
            'books', 'textbook',
        ],
    }
    
    def __init__(self):
        """Initialize the keyword classifier"""
        # Pre-compile regex patterns for efficiency
        self.patterns = {}
        for category, keywords in self.CATEGORIES.items():
            # Create case-insensitive pattern with word boundaries
            pattern = r'\b(' + '|'.join(re.escape(kw) for kw in keywords) + r')\b'
            self.patterns[category] = re.compile(pattern, re.IGNORECASE)
    
    def classify(self, vendor: Optional[str] = None, 
                 line_items: Optional[List[Dict]] = None,
                 description: Optional[str] = None) -> Dict[str, any]:
        """
        Classify expense based on vendor name and line items.
        
        Args:
            vendor: Merchant/vendor name
            line_items: List of items purchased (each with 'item_name' field)
            description: Additional description text
            
        Returns:
            Dictionary with category, confidence, and matching keywords
        """
        # Combine all text for matching
        text_parts = []
        if vendor:
            text_parts.append(vendor)
        if line_items:
            for item in line_items:
                if isinstance(item, dict) and 'item_name' in item:
                    text_parts.append(item['item_name'])
        if description:
            text_parts.append(description)
        
        combined_text = ' '.join(text_parts)
        
        # If no text provided, return 'other'
        if not combined_text.strip():
            return {
                'category': 'other',
                'confidence': 0.0,
                'method': 'keyword_classifier',
                'matched_keywords': []
            }
        
        # Score each category
        category_scores = {}
        category_matches = {}
        
        for category, pattern in self.patterns.items():
            matches = pattern.findall(combined_text)
            if matches:
                # Score = number of unique keyword matches
                unique_matches = list(set(m.lower() for m in matches))
                category_scores[category] = len(unique_matches)
                category_matches[category] = unique_matches
        
        # Select best category
        if not category_scores:
            return {
                'category': 'other',
                'confidence': 0.0,
                'method': 'keyword_classifier',
                'matched_keywords': []
            }
        
        best_category = max(category_scores, key=category_scores.get)
        best_score = category_scores[best_category]
        
        # Calculate confidence (simple heuristic)
        # 1 match = 0.5, 2 matches = 0.7, 3+ matches = 0.9
        confidence = min(0.5 + (best_score - 1) * 0.2, 0.9)
        
        return {
            'category': best_category,
            'confidence': confidence,
            'method': 'keyword_classifier',
            'matched_keywords': category_matches[best_category][:5]  # Top 5 matches
        }
    
    def get_categories(self) -> List[str]:
        """Get list of supported categories"""
        return list(self.CATEGORIES.keys()) + ['other']


def test_classifier():
    """Test the classifier with sample data"""
    classifier = KeywordClassifier()
    
    test_cases = [
        {'vendor': 'SWIGGY', 'expected': 'food'},
        {'vendor': 'Uber', 'expected': 'travel'},
        {'vendor': 'Netflix', 'expected': 'entertainment'},
        {'vendor': 'Airtel Broadband', 'expected': 'utilities'},
        {'vendor': 'Amazon', 'expected': 'supplies'},
        {'vendor': 'Random Store', 'expected': 'other'},
    ]
    
    print("Testing Keyword Classifier\n")
    for test in test_cases:
        result = classifier.classify(vendor=test['vendor'])
        status = "✅" if result['category'] == test['expected'] else "❌"
        print(f"{status} {test['vendor']:20s} → {result['category']:15s} (confidence: {result['confidence']:.2f})")
        if result['matched_keywords']:
            print(f"   Keywords: {', '.join(result['matched_keywords'])}")


if __name__ == '__main__':
    test_classifier()
