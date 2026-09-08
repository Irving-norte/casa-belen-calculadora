export default function Marcador({ titulo, nota }: { titulo: string; nota: string }) {
  return (
    <section className="rounded-xl bg-white p-4">
      <h2 className="text-[15px] font-medium">{titulo}</h2>
      <p className="mt-1 text-[13px] text-gris-texto">{nota}</p>
    </section>
  )
}
