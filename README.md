# Technique: Georgia Tech's Student-Run News Website

Welcome to the repository for [Technique](https://nique.net/), Georgia Tech's official student newspaper, known as "The South's Liveliest College Newspaper." This project encompasses the development and maintenance of our website, serving the campus community by providing information, analysis, and opinions that reflect the needs and interests of the students. ([gatech.campuslabs.com](https://gatech.campuslabs.com/engage/organization/the-technique?utm_source=chatgpt.com))

## Table of Contents

- [Project Overview](#project-overview)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [License](#license)
- [Contact Information](#contact-information)

## Project Overview

The Technique website is designed to deliver timely news, feature articles, opinions, entertainment reviews, and sports updates pertinent to the Georgia Tech community. Our goal is to maintain an intuitive, user-friendly platform that effectively showcases our journalistic content.

## Technologies Used

- **Frontend:**
  - HTML5
  - CSS3
  - JavaScript
  - [React.js](https://reactjs.org/) (version 17.0.2)

- **Backend:**
  - [Node.js](https://nodejs.org/) (version 14.17.0)
  - [Express.js](https://expressjs.com/) (version 4.17.1)

- **Database:**
  - [MongoDB](https://www.mongodb.com/) (version 4.4.6)

- **Version Control:**
  - [Git](https://git-scm.com/) (version 2.31.1)

- **Deployment:**
  - TBD

## Getting Started

To set up a local development environment, follow these steps:

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/technique.git
   cd technique
   ```

2. **Install Dependencies:**

   Ensure you have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed. Then, run:

   ```bash
   npm install
   ```

3. **Set Up Environment Variables:**

   Create a `.env` file in the root directory and add the following variables:

   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Start the Development Server:**

   ```bash
   npm run dev
   ```

   The application will be accessible at `http://localhost:3000`.

## Contributing

We welcome contributions from the community. To contribute:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/YourFeature`
3. Make your changes and commit them: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a Pull Request.

Please ensure your code adheres to our coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


---

*Note: This README is intended for developers involved in the maintenance and development of the Technique website.*
