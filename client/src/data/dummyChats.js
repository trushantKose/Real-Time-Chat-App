export const dummyChats = [
    {
        id: 1,
        name:"Priya Sharma",
        avatar: "PS",
        online: true,
        lastMessage: "See, you soon!",
        time: "9:15 PM",
        unread: 1,
        messages: [
            {
                id: 1,
                text: "Hey, Trushant",
                sender: "other",
                time: "9:12 PM"
            },
            {
                id: 2,
                text: "Hello priya! How are you?",
                sender: "me",
                time: "9:13 PM"
            },
            {
                id: 3,
                text: "See you soon!",
                sender: "other",
                time: "9:15 PM"
            }
        ]
    },
    {
        id: 2,
        name:"Trushant singh",
        avatar: "TS",
        online: true,
        lastMessage: "Okay bro!",
        time: "8:15 PM",
        unread: 0,
        messages: [
            {
                id: 1,
                text: "Hey, Rahul",
                sender: "me",
                time: "8:48 PM"
            },
            {
                id: 2,
                text: "Okay bro!",
                sender: "other",
                time: "8:50 PM"
            }
        ]
    },
    {
        id: 3,
        name:"Rahul Sharma",
        avatar: "RS",
        online: false,
        lastMessage: "See you soon!",
        time: "yesterday",
        unread: 0,
        messages: [
            {
                id: 1,
            text: "Great project!",
            sender: "other",
            time: "Yesterday"
            }
        ]
    },
    {
        id: 4,
        name: "Amit Singh",
        avatar: "AS",
        online: true,
        lastMessage: "See you soon!",
        time: "yesterday",
        unread: 0,
        messages: [
            {
                id: 1,
                text: "Let's meet tomorrow.",
                sender: "other",
                time: "Yesterday"
            }
        ]
    }
]