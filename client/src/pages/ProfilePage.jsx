import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);

  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();
  const [name, setName] = useState(authUser.fullName);
  const [bio, setBio] = useState(authUser.bio);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      await updateProfile({ fullName: name, bio });
      navigate("/");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(selectedImage);
    reader.onload = async () => {
      const base64Image = reader.result;
      await updateProfile({ profilePic: base64Image, fullName: name, bio });
      navigate("/");
    };
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl flex items-stretch md:gap-8 overflow-hidden">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 p-6 sm:p-8 md:p-10 flex-1"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Profile details
              </h3>
              <p className="text-xs text-white/60 mt-1">
                Update your avatar, name, and bio.
              </p>
            </div>
            {/* Optional tiny logo on desktop for brand feel */}
            <img
              src={assets.logo_icon}
              alt="brand"
              className="hidden md:block w-10 h-10 opacity-70"
            />
          </div>

          {/* Avatar Upload */}
          <label
            htmlFor="avatar"
            className="flex items-center gap-3 sm:gap-4 cursor-pointer group"
            title="Upload profile image"
          >
            <input
              onChange={(e) => setSelectedImage(e.target.files[0])}
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg"
              hidden
            />
            <div className="relative">
              <img
                src={
                  selectedImage
                    ? URL.createObjectURL(selectedImage)
                    : assets.avatar_icon
                }
                alt="avatar preview"
                className={`w-14 h-14 sm:w-16 sm:h-16 object-cover ring-2 ring-white/15 ${
                  selectedImage ? "rounded-full" : ""
                }`}
              />
              <span className="absolute -bottom-1 -right-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow hidden sm:block">
                Change
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-white/90">
                Upload profile image
              </span>
              <span className="text-xs text-white/50">
                PNG or JPG, up to a few MB
              </span>
            </div>
          </label>

          {/* Name */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="name"
              className="text-xs uppercase tracking-wider text-white/60"
            >
              Name
            </label>
            <input
              id="name"
              onChange={(e) => setName(e.target.value)}
              value={name}
              type="text"
              required
              placeholder="Your name"
              className="p-3 rounded-lg bg-white/5 text-white placeholder-white/40 border border-white/10 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/50 transition"
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="bio"
              className="text-xs uppercase tracking-wider text-white/60"
            >
              Bio
            </label>
            <textarea
              id="bio"
              onChange={(e) => setBio(e.target?.value)}
              value={bio}
              placeholder="Write profile bio"
              required
              rows={4}
              className="p-3 rounded-lg bg-white/5 text-white placeholder-white/40 border border-white/10 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/50 transition resize-none"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-5 py-3 rounded-full text-base font-semibold shadow-lg hover:opacity-95 active:opacity-90 transition cursor-pointer"
          >
            Save
          </button>
        </form>

        {/* Right Visual Panel (kept non-functional, just visuals as before) */}
        <div className="hidden md:flex items-center justify-center pr-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl"></div>
            <img
              className={`relative w-40 h-40 rounded-full object-contain ring-2 ring-white/10 p-4 bg-white/5 ${
                selectedImage ? "rounded-full" : ""
              }`}
              src={authUser?.profilePic || assets.logo_icon}
              alt="app logo"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
