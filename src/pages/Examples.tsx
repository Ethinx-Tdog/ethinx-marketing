import BeforeAfterSlider from "../components/BeforeAfterSlider";
import { examplePairs } from "../data/examples";

export default function Examples() {
  if (!examplePairs.length) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold mb-4">Before & After</h1>
        <p className="text-white/80">
          Add your image pairs to <code>/public/examples/&lt;name&gt;/before.jpg</code> and <code>after.jpg</code>.
        </p>
      </section>
    );
  }
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-10">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-6">
        Before & After Examples
      </h1>
      <div className="grid gap-6 md:grid-cols-3">
        {examplePairs.map((p, i) => (
          <BeforeAfterSlider key={i} before={p.before} after={p.after} />
        ))}
      </div>
    </section>
  );
}
