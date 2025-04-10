# Technique: Georgia Tech's Student-Run News Website

Welcome to the repository for [Technique](https://nique.net/), Georgia Tech's official student newspaper, known as "The South's Liveliest College Newspaper." This project encompasses the development and maintenance of our website, serving the campus community by providing information, news, and opinions that reflect the needs and interests of the students. ([gatech.campuslabs.com](https://gatech.campuslabs.com/engage/organization/the-technique))

## Table of Contents

- [Project Overview](#project-overview)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [Contributing](#contributing)

## Project Overview

The Technique website is designed to deliver timely news, articles, opinions, entertainment reviews, and sports updates pertinent to the Georgia Tech community. Our goal is to maintain an intuitive, user-friendly platform that effectively showcases our journalistic content.

## Technologies Used

- **Frontend:**
  - [React](https://reactjs.org/) (version 19.0.0)
  - [Vite](https://vitejs.dev/) (version 6.1.0)
  - [Tailwind CSS](https://tailwindcss.com/) (version 4.0.5)
  - [TypeScript](https://www.typescriptlang.org/) (version 5.7.2)

- **Backend:**
  - [Node.js](https://nodejs.org/) (version 14.17.0)
  - [Express.js](https://expressjs.com/) (version 4.21.2)

- **Database:**
  - [MongoDB](https://www.mongodb.com/) (version 6.13.0)

- **Version Control:**
  - [Git](https://git-scm.com/) (version 2.45.1)

- **Deployment:**
  - TBD

## Getting Started

To set up a local development environment, follow these steps:

1. **Clone the Repository:**

   ```bash
   git clone https://github.gatech.edu/eli96/technique.git
   
   ```

2. **Install Frontend Dependencies:**

   Ensure you have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.

   Navigate to the `frontend` directory:

   ```bash
   cd frontend
   ```

   Then, run:

   ```bash
   npm install
   ```

4. **Start the Frontend Development Server:**

   ```bash
   npm run dev
   ```

   The application will be accessible at `http://localhost:5173`.

5. **Install Backend Dependencies:**

   In a separate terminal window, navigate to the `backend` directory:

   ```bash
   cd backend
   ```

   Then, run:

   ```bash
   npm install
   ```

3. **Set Up Environment Variables:**

   Create a `.env` file in the `backend` directory and add the following variables:

   ```env
   JWT_SECRET=your_secret_key
   ATLAS_URI=your_mongodb_connection_string
   PORT=5050
   ```

4. **Start the Backend Server:**
   
   ```bash
   npm run start
   ```
   The backend server will be up and running on port 5050.

## Contributing

We welcome contributions from the community. To contribute:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/YourFeature`
3. Make your changes and commit them: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a Pull Request.

Please ensure your code adheres to our coding standards and includes appropriate tests.

---

*Note: This README is intended for developers involved in the maintenance and development of the Technique website.*
