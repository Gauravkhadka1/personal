"use client";
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouteGuard } from "../../hooks/useRouteGuard";
import toast from "react-hot-toast";
import { LogIn } from "lucide-react";

const LoginForm = () => {
  const { login } = useAuth();
  useRouteGuard();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.id]: e.target.value });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      login(data.token);
      toast.success("Logged in successfully");
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 overflow-hidden">
      <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-blue-200 blur-3xl opacity-40"></div>
      <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-indigo-200 blur-3xl opacity-40"></div>

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* <div className="flex flex-col items-center space-y-8 mb-14">
          <img src="/webtech-black.svg" alt="Company Logo" className="h-16 w-auto" />
 
        </div> */}

        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              placeholder="Enter your password"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">Remember Me</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {/* <LogIn className="h-4 w-4 text-white" /> */}
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
