// views/home.jsx - Template for Swipjy users
function Home(props) {
    return (
        <html>
            <head>
                <title>Welcome to Swipjy</title>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <style dangerouslySetInnerHTML={{
                    __html: `
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 2rem;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .container {
              text-align: center;
              max-width: 600px;
            }
            h1 {
              font-size: 3rem;
              margin-bottom: 1rem;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .subtitle {
              font-size: 1.2rem;
              opacity: 0.9;
              margin-bottom: 2rem;
            }
            .features {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 1rem;
              margin-top: 2rem;
            }
            .feature {
              background: rgba(255,255,255,0.1);
              padding: 1rem;
              border-radius: 8px;
              backdrop-filter: blur(10px);
            }
            .emoji {
              font-size: 2rem;
              margin-bottom: 0.5rem;
            }
            #root {
              margin-top: 2rem;
            }
          `
                }} />
            </head>
            <body>
                <div className="container">
                    <h1>Hello, {props.name || 'World'}! 👋</h1>
                    <p className="subtitle">
                        Your Swipjy application is running successfully!
                    </p>

                    <div className="features">
                        <div className="feature">
                            <div className="emoji">⚡</div>
                            <h3>Fast</h3>
                            <p>Lightning fast development</p>
                        </div>
                        <div className="feature">
                            <div className="emoji">🛠️</div>
                            <h3>Flexible</h3>
                            <p>Build what you need</p>
                        </div>
                        <div className="feature">
                            <div className="emoji">🚀</div>
                            <h3>Modern</h3>
                            <p>Latest technologies</p>
                        </div>
                    </div>

                    <div id="root"></div>
                </div>
            </body>
        </html>
    );
}

export default Home;
