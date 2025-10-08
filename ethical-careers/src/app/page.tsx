export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 px-6">
      <a 
        href = "/login"
        className="fixed top-6 right-6 bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-300 transition"

      >
        Login
      </a>

      <div className = "flex gap-8">
        <h1 className="text-4xl font-bold mb-4 text-green-700">
          Ethical Careers 🌱
        </h1>
        <p className="text-lg max-w-xl text-center mb-8">
          Discover companies and opportunities that align with your values.
          Explore careers that make a positive impact on people and the planet.
        </p>
      </div>

      <div className="flex gap-4">
        <a
          href="/careers"
          className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-300 transition"
        >
          Explore Careers
        </a>
        <a
          href="/about"
          className="border border-green-700 text-green-700 px-6 py-3 rounded-lg hover:bg-green-100 transition"
        >
          Learn More
        </a>
      </div>
    </main>
  );
}