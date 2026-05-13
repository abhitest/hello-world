export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>MetaMind AI — API Server</h1>
      <p>This is the backend for the MetaMind Webflow App.</p>
      <ul>
        <li>
          <a href="/api/auth/authorize">Connect Webflow Account</a>
        </li>
      </ul>
    </main>
  );
}
