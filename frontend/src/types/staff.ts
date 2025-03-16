export interface Staff {
    name: string;
    role: string;
    email: string;
    contact: string | null;
}

export const staff: Staff[] = [
    {
        name: "Cole Murphy",
        role: "Editor-in-Chief",
        email: "editor@nique.net",
        contact: null
    },
    {
        name: "Alec Grosswald",
        role: "Managing Editor",
        email: "managing.editor@nique.net",
        contact: null
    },
    {
        name: "Amarachi Nnabue",
        role: "Head Copy Editor",
        email: "copy@nique.net",
        contact: null
    },
    {
        name: "Sydney Gordon",
        role: "Online Editor",
        email: "online@nique.net",
        contact: null
    },
    {
        name: "Anika Nallur",
        role: "Photograph Editor",
        email: "photo@nique.net",
        contact: null
    },
    {
        name: "Christine Lee",
        role: "Design Editor",
        email: "design@nique.net",
        contact: null
    },
    {
        name: "Rohan Raman",
        role: "Sports Editor",
        email: "", // no email address provided
        contact: null
    },
    {
        name: "Parker Avery",
        role: "Life Editor",
        email: "", // no email address provided
        contact: null
    },
    {
        name: "Ethan Percell",
        role: "Opinions Editor",
        email: "opinions@nique.net",
        contact: null
    },
    {
        name: "Sanika Tank",
        role: "News Editor",
        email: "news@nique.net",
        contact: null
    },
    {
        name: "Jenna Guiher",
        role: "Entertainment Editor",
        email: "entertainment@nique.net",
        contact: null
    },
    {
        name: "Shaswat Dhakal",
        role: "Technology Editor",
        email: "developer@nique.net",
        contact: null
    },
    {
        name: "Mac Pitts",
        role: "Director of Student Media",
        email: "mac.pitts@vpss.gatech.edu",
        contact: "(404) 894-7732"
    }
];
