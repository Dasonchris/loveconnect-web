import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, userAPI, saveSession, getCurrentUser } from "../api";
import "./Profile.css";

const initialForm = {
  name: "",
  age: "",
  bio: "",
  location: "",
  hobbies: "",
  photo: "",
};

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authAPI.isLoggedIn()) {
      navigate("/");
      return;
    }

    const currentUser = getCurrentUser();
    if (currentUser) {
      initializeForm(currentUser);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const userData = await authAPI.getMe();
        initializeForm(userData);
      } catch (err) {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const initializeForm = (user) => {
    setForm({
      name: user.name || "",
      age: user.age?.toString() || "",
      bio: user.bio || "",
      location: user.location || "",
      hobbies: (user.hobbies || []).join(", "),
      photo: user.photo || "",
    });
    setPreview(user.photo || "");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");

    if (name === "photo") {
      setPreview(value);
    }
  };

  const handlePhotoFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result;
      setPreview(imageData);
      setForm((prev) => ({ ...prev, photo: imageData }));
      setError("");
      setSuccess("");
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!form.photo) {
      setError("Choose a photo URL or upload an image first.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const updated = await userAPI.updatePhoto(form.photo);
      const currentUser = getCurrentUser();
      const newUser = { ...currentUser, photo: updated.photo || form.photo };
      saveSession(localStorage.getItem("token"), newUser, newUser.isPremium);
      setPreview(updated.photo || form.photo);
      setSuccess("Profile photo saved successfully.");
    } catch (err) {
      setError("Unable to save profile photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!form.photo.trim()) {
      setError("Please upload a profile photo before saving.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await userAPI.updatePhoto(form.photo);
      const updated = await userAPI.updateProfile({
        name: form.name,
        age: form.age,
        bio: form.bio,
        location: form.location,
        hobbies: form.hobbies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      const currentUser = getCurrentUser();
      const newUser = { ...currentUser, ...updated, photo: form.photo };
      saveSession(localStorage.getItem("token"), newUser, newUser.isPremium);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      setError("Unable to save profile. Make sure your photo is uploaded.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-shell">
        <div className="profile-loading">Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-shell">
      <div className="profile-card">
        <div className="profile-top">
          <div>
            <h1>Your Profile</h1>
            <p>
              This is your story. Add a photo, write a short bio, and highlight what makes you unique.
            </p>
          </div>
          <button className="profile-back-btn" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>

        <div className="profile-columns">
          <div className="profile-side">
            <div className="photo-preview-box">
              {preview ? (
                <img src={preview} alt="Profile preview" />
              ) : (
                <div className="photo-placeholder">No photo selected yet</div>
              )}
            </div>

            <label className="file-picker">
              Upload Photo <span className="required-indicator">*</span>
              <input type="file" accept="image/*" onChange={handlePhotoFile} />
            </label>

            <label>
              Photo URL <span className="required-indicator">*</span>
              <input
                name="photo"
                value={form.photo}
                onChange={handleChange}
                placeholder="Paste an image URL"
              />
            </label>

            <button className="photo-save-btn" onClick={handleUploadPhoto} disabled={uploading}>
              {uploading ? "Saving photo..." : "Save Photo"}
            </button>
            <small>Recommended: JPG/PNG image, 400×400 or square crop.</small>
          </div>

          <div className="profile-form">
            <label>
              Name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
              />
            </label>

            <label>
              Age
              <input
                name="age"
                type="number"
                value={form.age}
                onChange={handleChange}
                placeholder="Your age"
              />
            </label>

            <label>
              Location
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="City, country"
              />
            </label>

            <label>
              Bio
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Write a short bio about yourself"
                rows={4}
              />
            </label>

            <label>
              Hobbies
              <input
                name="hobbies"
                value={form.hobbies}
                onChange={handleChange}
                placeholder="e.g. Hiking, Reading, Cooking"
              />
            </label>

            {error && <div className="profile-error">{error}</div>}
            {success && <div className="profile-success">{success}</div>}

            <button className="profile-save-btn" onClick={handleSave} disabled={saving || !form.photo.trim()}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
