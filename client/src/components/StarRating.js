import React, { useState } from "react";

const StarRating = ({
  recipeId,
  averageRating = 0,
  ratingCount = 0,
  userRating = null,
  isLoggedIn = false,
  onRatingUpdate,
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = async (rating) => {
    if (!isLoggedIn || isSubmitting) return;

    setIsSubmitting(true);
    const token = localStorage.getItem("REACT_TOKEN_AUTH_KEY");

    try {
      const response = await fetch(`/rating/recipe/${recipeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JSON.parse(token)}`,
        },
        body: JSON.stringify({ rating }),
      });

      if (response.ok) {
        const data = await response.json();
        if (onRatingUpdate) {
          onRatingUpdate(data);
        }
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating || userRating || averageRating;

  const renderStar = (index) => {
    const starValue = index + 1;
    const isFilled = starValue <= displayRating;
    const isHalfFilled = !isFilled && starValue - 0.5 <= displayRating;

    return (
      <span
        key={index}
        className={`star ${isFilled ? "filled" : ""} ${isHalfFilled ? "half-filled" : ""} ${isLoggedIn && !isSubmitting ? "clickable" : ""}`}
        onMouseEnter={() =>
          isLoggedIn && !isSubmitting && setHoverRating(starValue)
        }
        onMouseLeave={() => setHoverRating(0)}
        onClick={() => handleStarClick(starValue)}
      >
        ★
      </span>
    );
  };

  return (
    <div className="star-rating">
      <div className="stars">{[0, 1, 2, 3, 4].map(renderStar)}</div>
      <div className="rating-info">
        {ratingCount > 0 ? (
          <span className="rating-text">
            {averageRating.toFixed(1)} ({ratingCount}{" "}
            {ratingCount === 1 ? "rating" : "ratings"})
          </span>
        ) : (
          <span className="rating-text no-ratings">No ratings yet</span>
        )}
        {userRating && isLoggedIn && (
          <span className="user-rating">Your rating: {userRating}★</span>
        )}
        {isSubmitting && <span className="loading">Submitting...</span>}
      </div>
    </div>
  );
};

export default StarRating;
