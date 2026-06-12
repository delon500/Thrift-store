import React, { useState } from "react";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import { images } from "../../../assets/images/images";
import { Link } from "react-router-dom";

const AuthPage = () => {
  const [mode, setMode] = useState("login");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <main className="w-full max-w-[1200px] grid md:grid-cols-2 bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,106,99,0.1)] border-4 border-white">
        <section className="hidden md:flex flex-col justify-center items-center p-10 lg:p-20 bg-primary-container relative overflow-hidden">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary font-semibold mb-8 hover:translate-x-1 transition-transform"
          >
            <span>←</span>
            <span>Back to Home</span>
          </Link>

          <div className="absolute top-10 left-10 rotate-[-12deg] bg-white p-2 border-4 border-white rounded-2xl shadow-md">
            <span className="text-primary text-4xl">★</span>
          </div>

          <div className="absolute bottom-20 right-10 rotate-[15deg] bg-white p-2 border-4 border-white rounded-2xl shadow-md">
            <span className="text-tertiary text-4xl">📚</span>
          </div>

          <div className="absolute top-1/4 right-5 rotate-[-5deg] bg-white p-2 border-4 border-white rounded-2xl shadow-md">
            <span className="text-secondary text-4xl">🎨</span>
          </div>

          <div className="relative z-10 text-center">
            <div className="w-full aspect-square max-w-[400px] mb-8 rounded-full border-8 border-white overflow-hidden shadow-xl bg-white/20 flex items-center justify-center">
              <img
                alt="Thrift School Illustration"
                className="w-full h-full object-cover"
                src={images.auth}
              />
            </div>

            <h1 className="text-white text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Thrift School
            </h1>

            <p className="text-white/90 text-lg max-w-sm mx-auto">
              Buy school items and manage registrations for parents, students,
              schools, and staff.
            </p>
          </div>

          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#bdc9c6_0.5px,transparent_0.5px)] bg-[size:24px_24px]" />
        </section>

        <section className="p-6 sm:p-10 lg:p-20 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            <header className="mb-8 text-center md:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-low mb-6 border-4 border-white shadow-md">
                <span className="text-primary text-3xl">🔐</span>
              </div>

              <h2 className="text-3xl font-semibold text-on-surface mb-2">
                {mode === "login"
                  ? "Welcome Back!"
                  : "Create Registration Request"}
              </h2>

              <p className="text-on-surface-variant">
                {mode === "login"
                  ? "Sign in to your Thrift School account."
                  : "Choose a role and submit your registration request."}
              </p>
            </header>

            <div className="flex bg-surface-container-low rounded-full p-1 mb-8">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-3 rounded-full font-semibold transition-all ${
                  mode === "login"
                    ? "bg-primary-container text-on-primary-container shadow-md"
                    : "text-slate-600"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 py-3 rounded-full font-semibold transition-all ${
                  mode === "register"
                    ? "bg-primary-container text-on-primary-container shadow-md"
                    : "text-slate-600"
                }`}
              >
                Register
              </button>
            </div>

            {mode === "login" ? <LoginForm /> : <RegisterForm />}

            <footer className="mt-10 text-center">
              {mode === "login" ? (
                <p className="text-sm text-on-surface-variant">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-primary font-bold hover:underline cursor-pointer"
                  >
                    Create a request
                  </button>
                </p>
              ) : (
                <p className="text-sm text-on-surface-variant">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-primary font-bold hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuthPage;
