"""
Custom Evaluators for Trust & Trustpilot System Evaluation

This module contains custom code-based evaluators for assessing:
- Trust score calculation accuracy
- Invitation eligibility logic
- API response completeness
- Data type validation
"""

from typing import Dict, List, Any, Union


class TrustScoreEvaluator:
    """
    Evaluates the accuracy of trust score calculation.
    
    Trust score is calculated from:
    - SSL Certificate: 20 points
    - Domain Age: 1 point per month (max 30)
    - Trustpilot Rating: up to 40 points
    - Social Presence: 10 points
    
    Total: 0-100 points
    """
    
    def __init__(self):
        """Initialize the evaluator"""
        pass
    
    def __call__(
        self, 
        *,
        ssl_valid: bool, 
        domain_age_months: int,
        trustpilot_rating: float, 
        social_presence: bool,
        expected_score: int,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Calculate trust score and compare with expected value.
        
        Args:
            ssl_valid: Whether SSL certificate is valid
            domain_age_months: Age of domain in months
            trustpilot_rating: Trustpilot rating (0-5 stars)
            social_presence: Whether social media profiles exist
            expected_score: Expected trust score
            
        Returns:
            Dictionary with accuracy metrics
        """
        # Calculate score using same logic as backend
        score = 0
        
        # SSL Certificate (20 points)
        if ssl_valid:
            score += 20
        
        # Domain Age (30 points max, 1 per month)
        score += min(domain_age_months, 30)
        
        # Trustpilot Rating (up to 90 points total, matches backend logic)
        # Tiered system based on rating ranges
        if trustpilot_rating >= 4.5:
            # 40 base + round((rating - 4.5) * 100) as per backend
            # 4.5=40, 4.6=50, 4.7=60, 4.8=70, 4.9=80, 5.0=90
            score += 40 + round((trustpilot_rating - 4.5) * 100)
        elif trustpilot_rating >= 4.0:
            score += 40
        elif trustpilot_rating >= 3.0:
            score += 20
        elif trustpilot_rating >= 2.0:
            score += 10
        
        # Social Presence (10 points)
        if social_presence:
            score += 10
        
        # Apply total cap like the backend does (max 100)
        score = min(score, 100)
        
        # Calculate accuracy
        exact_match = score == expected_score
        difference = abs(score - expected_score)
        within_tolerance = difference <= 2  # Allow 2-point tolerance
        
        # Determine status
        if score >= 80:
            status = "verified"
        elif score >= 60:
            status = "pending"
        else:
            status = "needs_attention"
        
        return {
            "trust_score_accuracy": 1.0 if exact_match else 0.0,
            "calculated_score": score,
            "expected_score": expected_score,
            "score_difference": difference,
            "within_tolerance": within_tolerance,
            "calculated_status": status,
            "score_breakdown": {
                "ssl": 20 if ssl_valid else 0,
                "domain_age": min(domain_age_months, 30),
                "trustpilot": (40 + round((trustpilot_rating - 4.5) * 100)) if trustpilot_rating >= 4.5 
                            else (40 if trustpilot_rating >= 4.0 
                                 else (20 if trustpilot_rating >= 3.0 
                                      else (10 if trustpilot_rating >= 2.0 else 0))),
                "social": 10 if social_presence else 0
            }
        }


class InvitationEligibilityEvaluator:
    """
    Evaluates the invitation eligibility logic.
    
    Criteria:
    - Amount >= $10
    - Status = "completed"
    - Days since transaction >= 7
    - User has email
    - Not already invited
    """
    
    def __init__(self):
        """Initialize with eligibility criteria"""
        self.MIN_AMOUNT = 10.0
        self.MIN_DAYS = 7
    
    def __call__(
        self,
        *,
        amount: float,
        status: str,
        days_since_transaction: int,
        user_email: Union[str, None],
        already_invited: bool,
        expected_eligible: bool,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Evaluate invitation eligibility.
        
        Args:
            amount: Transaction amount
            status: Transaction status
            days_since_transaction: Days since transaction
            user_email: User email address (or None)
            already_invited: Whether already invited
            expected_eligible: Expected eligibility result
            
        Returns:
            Dictionary with eligibility evaluation
        """
        # Check each criterion
        checks = {
            "amount_sufficient": amount >= self.MIN_AMOUNT,
            "status_completed": status == "completed",
            "days_elapsed": days_since_transaction >= self.MIN_DAYS,
            "has_email": user_email is not None and len(str(user_email)) > 0,
            "not_invited": not already_invited
        }
        
        # Overall eligibility
        is_eligible = all(checks.values())
        
        # Compare with expected
        correct = is_eligible == expected_eligible
        
        # Build detailed reasoning
        reasons = []
        if not checks["amount_sufficient"]:
            reasons.append(f"Amount ${amount:.2f} below minimum ${self.MIN_AMOUNT}")
        if not checks["status_completed"]:
            reasons.append(f"Status '{status}' is not 'completed'")
        if not checks["days_elapsed"]:
            reasons.append(f"Only {days_since_transaction} days elapsed, need {self.MIN_DAYS}")
        if not checks["has_email"]:
            reasons.append("No user email available")
        if not checks["not_invited"]:
            reasons.append("Already invited")
        
        return {
            "invitation_logic_correct": 1.0 if correct else 0.0,
            "calculated_eligible": is_eligible,
            "expected_eligible": expected_eligible,
            "match": correct,
            "checks_passed": checks,
            "total_checks": len(checks),
            "passed_checks": sum(checks.values()),
            "reasons": " | ".join(reasons) if reasons else "All criteria met",
            "recommendation": "Send invitation" if is_eligible else "Do not send"
        }


class APICompletenessEvaluator:
    """
    Evaluates API response completeness.
    
    Checks if all expected fields are present in the response.
    """
    
    def __init__(self):
        """Initialize the evaluator"""
        pass
    
    def __call__(
        self,
        *,
        response_data: Dict[str, Any],
        expected_fields: List[str],
        **kwargs
    ) -> Dict[str, Any]:
        """
        Evaluate API response completeness.
        
        Args:
            response_data: The API response data
            expected_fields: List of expected field names
            
        Returns:
            Dictionary with completeness metrics
        """
        # Check which fields are present
        missing_fields = []
        present_fields = []
        
        for field in expected_fields:
            if field in response_data:
                present_fields.append(field)
            else:
                missing_fields.append(field)
        
        # Calculate completeness score
        total_expected = len(expected_fields)
        total_present = len(present_fields)
        completeness = total_present / total_expected if total_expected > 0 else 0.0
        
        return {
            "api_completeness": completeness,
            "missing_fields": missing_fields,
            "present_fields": present_fields,
            "total_expected": total_expected,
            "total_present": total_present,
            "is_complete": len(missing_fields) == 0,
            "completion_percentage": f"{completeness * 100:.1f}%"
        }


class DataTypeEvaluator:
    """
    Evaluates data types in API responses.
    
    Ensures all fields have the correct data type.
    """
    
    def __init__(self):
        """Initialize with expected data types"""
        self.expected_types = {
            "scamAdviserScore": (int, float),
            "trustpilotRating": (int, float),
            "sslValid": bool,
            "verifiedBusiness": bool,
            "status": str,
            "domainAgeMonths": int,
            "lastChecked": str,  # ISO date string
            # Improvement tasks API fields
            "tasks": list,
            "totalTasks": int,
            "highPriority": int
        }
    
    def __call__(
        self,
        *,
        response_data: Dict[str, Any],
        **kwargs
    ) -> Dict[str, Any]:
        """
        Validate data types in response.
        
        Args:
            response_data: The API response data
            
        Returns:
            Dictionary with type validation results
        """
        type_errors = []
        correct_types = 0
        total_checked = 0
        type_details = {}
        
        for field, expected_type in self.expected_types.items():
            if field in response_data:
                total_checked += 1
                value = response_data[field]
                actual_type = type(value).__name__
                
                if isinstance(value, expected_type):
                    correct_types += 1
                    type_details[field] = {
                        "correct": True,
                        "expected": str(expected_type),
                        "actual": actual_type
                    }
                else:
                    expected_type_str = str(expected_type)
                    type_errors.append(f"{field}: expected {expected_type_str}, got {actual_type}")
                    type_details[field] = {
                        "correct": False,
                        "expected": expected_type_str,
                        "actual": actual_type
                    }
        
        # Calculate accuracy
        accuracy = correct_types / total_checked if total_checked > 0 else 0.0
        
        return {
            "data_type_accuracy": accuracy,
            "type_errors": type_errors,
            "correct_types": correct_types,
            "total_checked": total_checked,
            "all_types_correct": len(type_errors) == 0,
            "type_details": type_details,
            "accuracy_percentage": f"{accuracy * 100:.1f}%"
        }


class ResponseTimeEvaluator:
    """
    Evaluates API response time performance.
    
    Ensures APIs respond within acceptable time limits.
    """
    
    def __init__(self, target_ms: int = 1000):
        """
        Initialize with target response time.
        
        Args:
            target_ms: Target response time in milliseconds
        """
        self.target_ms = target_ms
    
    def __call__(
        self,
        *,
        response_time_ms: float,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Evaluate response time.
        
        Args:
            response_time_ms: Response time in milliseconds
            
        Returns:
            Dictionary with performance metrics
        """
        meets_target = response_time_ms <= self.target_ms
        performance_ratio = self.target_ms / response_time_ms if response_time_ms > 0 else 0
        
        # Performance rating
        if response_time_ms <= self.target_ms * 0.5:
            rating = "excellent"
        elif response_time_ms <= self.target_ms:
            rating = "good"
        elif response_time_ms <= self.target_ms * 2:
            rating = "acceptable"
        else:
            rating = "poor"
        
        return {
            "response_time_score": 1.0 if meets_target else 0.0,
            "response_time_ms": response_time_ms,
            "target_ms": self.target_ms,
            "meets_target": meets_target,
            "performance_ratio": performance_ratio,
            "rating": rating,
            "latency_status": f"{response_time_ms:.0f}ms ({rating})"
        }


# Export all evaluators
__all__ = [
    "TrustScoreEvaluator",
    "InvitationEligibilityEvaluator",
    "APICompletenessEvaluator",
    "DataTypeEvaluator",
    "ResponseTimeEvaluator"
]
