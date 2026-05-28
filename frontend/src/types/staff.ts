export interface Staff {
    name: string;
    role: string;
    email: string;
    contact: string | null;
}

export const staff: Staff[] = [
    {
        name: "Kingston Barber",
        role: "Editor-in-Chief",
        email: "editor@nique.net",
        contact: "(901) 832-8380"
    },
    {
        name: "Parker Avery",
        role: "Managing Editor",
        email: "managing.editor@nique.net",
        contact: null
    },
    {
        name: "Amara Nnabue",
        role: "Head Copy Editor",
        email: "copy@nique.net",
        contact: null
    },
    {
        name: "Erica Yun",
        role: "Online Editor",
        email: "online@nique.net",
        contact: null
    },
    {
        name: "Anika Nallur",
        role: "Photography Editor",
        email: "photo@nique.net",
        contact: null
    },
    {
        name: "Audrey Bewley",
        role: "Design Editor",
        email: "design@nique.net",
        contact: null
    },
    {
        name: "Michael London",
        role: "Sports Editor",
        email: "sports@nique.net",
        contact: null
    },
    {
        name: "Katherine Sanders",
        role: "Life Editor",
        email: "life@nique.net", // no email address provided
        contact: null
    },
    {
        name: "Madison Winston",
        role: "Opinions Editor",
        email: "opinions@nique.net",
        contact: null
    },
    {
        name: "Haris Rashli",
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
        name: "Mac Pitts",
        role: "Director of Student Media",
        email: "mac.pitts@vpss.gatech.edu",
        contact: "(404) 894-7732"
    }
];
