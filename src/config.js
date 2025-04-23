const config = {
    mongodb: {
      uri: process.env.MONGODB_URI || "mongodb+srv://himanshuraj97653:rahul48512@cluster0.cobii6f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    },
    nextAuth: {
      url: process.env.NEXTAUTH_URL || "http://localhost:3000",
      secret: process.env.NEXTAUTH_SECRET || "LJr2H4C5+5SbJK9NyT1L5bk/F0AV23KaQZVzP0RaoTc="
    },
    email: {
      user: process.env.EMAIL_USER || "himanshuraj48512@gmail.com",
      pass: process.env.EMAIL_PASS || "oxlh hauj rdwg gkcb"
    },
    app: {
      url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    },
    admin: {
      email: process.env.ADMIN_EMAIL || "himanshuraj48512@gmail.com",
      password: process.env.ADMIN_PASSWORD || "Rahul@663456"
    }
  };
  
  export default config;