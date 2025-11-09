#!/usr/bin/env python3
"""
Hybrid Receipt Analyzer - Production Version
Uses LLM (OpenAI/Gemini) as primary method with intelligent fallback to regex
Phase 3: Includes fraud detection and receipt storage
"""

import sys
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

# Import analyzers
try:
    from analyzer_llm import LLMReceiptAnalyzer, is_available as llm_available
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False

try:
    from analyzer_fallback import ReceiptAnalyzer as FallbackAnalyzer
    FALLBACK_AVAILABLE = True
except ImportError:
    FALLBACK_AVAILABLE = False

# Import fraud detection
try:
    from receipt_storage import ReceiptStorage
    from fraud_detector import FraudDetector
    FRAUD_DETECTION_AVAILABLE = True
except ImportError:
    FRAUD_DETECTION_AVAILABLE = False
    print("Warning: Fraud detection not available")


class HybridReceiptAnalyzer:
    def __init__(self, force_fallback=False, enable_fraud_detection=True):
        self.force_fallback = force_fallback
        self.enable_fraud_detection = enable_fraud_detection
        self.llm_analyzer = None
        self.fallback_analyzer = None
        self.storage = None
        self.fraud_detector = None
        
        # Initialize fraud detection
        if enable_fraud_detection and FRAUD_DETECTION_AVAILABLE:
            try:
                self.storage = ReceiptStorage()
                self.fraud_detector = FraudDetector(self.storage)
                print("🔒 Fraud detection enabled")
            except Exception as e:
                print(f"Warning: Fraud detection init failed: {e}")
        
        if not force_fallback and LLM_AVAILABLE and llm_available():
            try:
                self.llm_analyzer = LLMReceiptAnalyzer()
                print("LLM analyzer initialized (primary)")
            except Exception as e:
                print(f"LLM init failed: {e}")
        
        if FALLBACK_AVAILABLE:
            self.fallback_analyzer = FallbackAnalyzer()
        
        if not self.llm_analyzer and not self.fallback_analyzer:
            raise RuntimeError("No analyzer available")
    
    def analyze(self, file_path):
        result = None
        
        if self.llm_analyzer and not self.force_fallback:
            try:
                print("Attempting LLM extraction...")
                result = self.llm_analyzer.analyze(file_path)
                if not result.get("extracted_data", {}).get("amount"):
                    result = None
            except Exception as e:
                print(f"LLM failed: {e}")
                result = None
        
        if result is None and self.fallback_analyzer:
            try:
                result = self.fallback_analyzer.analyze(file_path)
                if not result.get("timestamp"):
                    result["timestamp"] = datetime.now().isoformat()
            except Exception as e:
                raise RuntimeError(f"All methods failed: {e}")
        
        if result is None:
            raise RuntimeError("No extraction succeeded")
        
        if "metadata" not in result:
            result["metadata"] = {}
        
        # Perform fraud checks if enabled
        if self.fraud_detector:
            try:
                print("\n🔍 Running fraud detection...")
                fraud_checks = self.fraud_detector.perform_fraud_checks(file_path, result)
                result["fraud_checks"] = fraud_checks
                
                # Print fraud warnings
                if fraud_checks.get("duplicate_detected"):
                    print(f"⚠️  WARNING: Duplicate receipt detected!")
                    if fraud_checks.get("similar_receipts"):
                        print(f"   Found {len(fraud_checks['similar_receipts'])} similar receipt(s)")
                
                if fraud_checks.get("flags"):
                    print(f"⚠️  Anomaly flags: {len(fraud_checks['flags'])}")
                    for flag in fraud_checks['flags']:
                        emoji = "🔴" if flag['severity'] == 'critical' else "🟡"
                        print(f"   {emoji} [{flag['severity'].upper()}] {flag['message']}")
                
                # Save to storage if not a duplicate
                if not fraud_checks.get("duplicate_detected"):
                    receipt_id = self.storage.save_receipt(result, file_path)
                    result["receipt_id"] = receipt_id
                    print(f"💾 Saved to storage: {receipt_id}")
                else:
                    print(f"⏭️  Skipped saving (duplicate detected)")
                
            except Exception as e:
                print(f"Warning: Fraud detection failed: {e}")
        
        return result
    
    def print_result(self, result):
        if self.llm_analyzer and result.get("metadata", {}).get("extraction_method") == "llm_receipt_ocr":
            self.llm_analyzer.print_result(result)
        elif self.fallback_analyzer:
            self.fallback_analyzer.print_result(result)
        
        # Print fraud detection summary
        if result.get("fraud_checks"):
            print("\n" + "="*50)
            print("🔒 FRAUD DETECTION SUMMARY")
            print("="*50)
            
            fraud = result["fraud_checks"]
            
            # Duplicate status
            dup_status = "⚠️  YES" if fraud.get("duplicate_detected") else "✅ NO"
            print(f"Duplicate Detected: {dup_status}")
            
            if fraud.get("similar_receipts"):
                print(f"Similar Receipts:   {len(fraud['similar_receipts'])} found")
            
            # Risk assessment
            risk_level = fraud.get("risk_level", "low").upper()
            risk_emoji = {"LOW": "🟢", "MEDIUM": "🟡", "HIGH": "🔴"}.get(risk_level, "⚪")
            print(f"Risk Level:         {risk_emoji} {risk_level}")
            print(f"Anomaly Score:      {fraud.get('anomaly_score', 0):.2f}")
            
            if fraud.get("flags"):
                print(f"\nFlags: {len(fraud['flags'])}")
                for flag in fraud['flags']:
                    print(f"  • [{flag['severity']}] {flag['message']}")
            
            print("="*50 + "\n")


def main():
    if len(sys.argv) < 2:
        print("Usage: python analyzer.py <file> [--fallback]")
        sys.exit(1)
    
    file_path = sys.argv[1]
    force_fallback = "--fallback" in sys.argv
    
    try:
        analyzer = HybridReceiptAnalyzer(force_fallback=force_fallback)
        result = analyzer.analyze(file_path)
        analyzer.print_result(result)
        
        output_file = Path(file_path).stem + "_analysis.json"
        with open(output_file, "w") as f:
            json.dump(result, f, indent=2)
        
        print(f"Saved to: {output_file}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
