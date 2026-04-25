// client\src\app\users\create\page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import withRoleAuth from "../../../hoc/withRoleAuth";
import { useRegisterUserMutation} from "@/state/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Select from 'react-select';

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    role: "USER" as "USER", 
    profilePictureUrl: "",
    password: "",
    confirmPassword: "",
    clientId: null as number | null,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const router = useRouter();
  const [registerUser] = useRegisterUserMutation();
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleClientChange = (selectedOption: any) => {
    setFormData({ ...formData, clientId: selectedOption?.value || null });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, profilePictureUrl: file.name });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }


    try {
      const userData = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        phone: formData.phone,
        email: formData.email,
        role: formData.role,
        profilePictureUrl: formData.profilePictureUrl,
        password: formData.password,
      };

      await registerUser(userData).unwrap();

      setSuccess("Account created successfully!");
      setFormData({
        firstname: "",
        lastname: "",
        phone: "",
        email: "",
        role: "USER",
        profilePictureUrl: "",
        password: "",
        confirmPassword: "",
        clientId: null,
      });
      setPreviewImage(null);

      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: any) {
      setError(err.data?.message || "Error creating account");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white border border-gray-200 shadow-xl rounded-xl">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Create Account
        </h2>
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        {success && <p className="text-green-600 text-sm text-center">{success}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                id="firstname"
                value={formData.firstname}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                id="lastname"
                value={formData.lastname}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="DESIGNER">DESIGNER</option>
              <option value="DEVELOPER">DEVELOPER</option>
              <option value="INTERN">Intern</option>
              <option value="CLIENT">Client</option> {/* Add CLIENT option */}
            </select>
          </div>

          
          <div>
            <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">
              Profile Picture
            </label>
            <div className="flex items-center mt-2 space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={previewImage || undefined} />
                <AvatarFallback>
                  {formData.firstname.charAt(0)}
                  {formData.lastname.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                id="profilePicture"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-200"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : "Sign Up"}
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

// export default withRoleAuth(SignUpForm, ["ADMIN"]);
export default SignUpForm;