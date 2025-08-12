//test/fixtures/sample-data.js

const sampleUsers = [
    { name: "John Doe", email: "john@example.com", age: 30 },
    { name: "Jane Smith", email: "jane@example.com", age: 28 },
    { name: "Bob Johnson", email: "bob@example.com", age: 35 },
];

const samplePosts = [
    {
        title: "First Post",
        content: "This is my first blog post",
        published: true,
    },
    { title: "Draft Post", content: "This is a draft", published: false },
    { title: "Another Post", content: "More content here", published: true },
];

module.exports = {
    sampleUsers,
    samplePosts,
};
