const React = require("react");

function Home(props) {
    const safeName = typeof props.name === "string" ? props.name : "Swipjy";

    return (
        <html>
            <head>
                <title>Welcome to Swipjy</title>
                <script type="module" src="/home.bundle.js"></script>
                <style>{`
          body {
            font-family: sans-serif;
            background: #f7f9fc;
            color: #333;
            padding: 2rem;
            text-align: center;
          }
          h1 {
            color: #0070f3;
            font-size: 2.5rem;
            margin-bottom: 1rem;
          }
          .hydrated {
            margin-top: 2rem;
            color: #888;
          }
        `}</style>
            </head>
            <body>
                <h1>Hello, {safeName}! 👋</h1>
                <div id="root">
                    <p className="hydrated">[Loading hydration... ⏳]</p>
                </div>
            </body>
        </html>
    );
}

module.exports = { default: Home };
