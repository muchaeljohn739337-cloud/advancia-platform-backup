export default function Layout({ children }) {
  return (
    <div
      style={{
        maxWidth: 640,
        margin: "40px auto",
        fontFamily: "Inter, system-ui, Arial",
      }}
    >
      <h1>Advancia</h1>
      <div>{children}</div>
    </div>
  );
}
