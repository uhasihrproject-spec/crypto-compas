export default function Pricing() {
  return (
    <section className="py-20 bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Pricing Plans</h2>
        <p className="mt-4 text-gray-400">Choose a plan that fits your trading journey</p>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            { name: "Starter", price: "Free", features: ["Basic Tracking", "Community Access"] },
            { name: "Pro", price: "$19/mo", features: ["Live Market Data", "Advanced Analytics", "Email Support"] },
            { name: "Enterprise", price: "Custom", features: ["Full API Access", "Dedicated Manager", "Custom Tools"] },
          ].map((plan) => (
            <div key={plan.name} className="rounded-2xl bg-gray-900/70 border border-gray-800 p-6 hover:shadow-lg hover:scale-105 transition">
              <h3 className="text-2xl font-semibold">{plan.name}</h3>
              <p className="mt-2 text-3xl font-bold">{plan.price}</p>
              <ul className="mt-4 space-y-2 text-gray-400">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <button className="mt-6 w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 py-2 text-white font-medium hover:opacity-90">
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
