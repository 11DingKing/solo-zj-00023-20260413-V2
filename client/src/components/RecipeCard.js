import React, { useState, useEffect } from "react";
import { Link, useHistory } from "react-router-dom";
import { useAuth } from "../auth";

const RecipeCard = ({ recipe, onDelete, onUpdate }) => {
  const [logged] = useAuth();
  const history = useHistory();
  const [isFavorited, setIsFavorited] = useState(recipe.is_favorited || false);

  useEffect(() => {
    setIsFavorited(recipe.is_favorited || false);
  }, [recipe.is_favorited]);

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!logged) return;

    const token = localStorage.getItem("REACT_TOKEN_AUTH_KEY");
    try {
      const response = await fetch(`/recipe/recipe/${recipe.id}/favorite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JSON.parse(token)}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.is_favorited);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= Math.round(rating);
      stars.push(
        <span key={i} style={{ color: isFilled ? "#ffc107" : "#ddd" }}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-card-link">
      <div className="recipe-card">
        <div className="recipe-card-header">
          <h3 className="recipe-card-title" title={recipe.title}>
            {recipe.title}
          </h3>
          {logged && (
            <button
              className={`favorite-btn ${isFavorited ? "favorited" : ""}`}
              onClick={toggleFavorite}
              title={isFavorited ? "取消收藏" : "添加收藏"}
            >
              <span className="heart">♥</span>
            </button>
          )}
        </div>
        <div className="recipe-card-body">
          <p className="recipe-card-description">{recipe.description}</p>
          <div className="recipe-rating">
            <div className="d-flex align-items-center gap-2">
              <div className="stars">{renderStars(recipe.average_rating || 0)}</div>
              <span className="text-muted small">
                {(recipe.average_rating || 0).toFixed(1)} ({recipe.rating_count || 0})
              </span>
            </div>
          </div>
        </div>
        <div className="recipe-card-footer">
          <div className="recipe-card-creator">
            创建者: <span>{recipe.creator_username || "未知"}</span>
          </div>
          <div className="recipe-card-date">{formatDate(recipe.created_at)}</div>
          {logged && onUpdate && onDelete && (
            <div className="recipe-actions">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onUpdate) onUpdate(recipe);
                }}
              >
                编辑
              </button>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onDelete) onDelete(recipe.id);
                }}
              >
                删除
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
