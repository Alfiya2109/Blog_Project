function checkLoginStatus() {
    const token = localStorage.getItem("accessToken");

    // Check if the token exists
    if (token) {
        // User is logged in, show logout button and hide login button
        document.getElementById("loginButton").style.display = "none";
        document.getElementById("logoutButton").style.display = "inline-block";
    } else {
        // User is not logged in, show login button and hide logout button
        document.getElementById("loginButton").style.display = "inline-block";
        document.getElementById("logoutButton").style.display = "none";
    }
}

// Call checkLoginStatus when the page loads
document.addEventListener("DOMContentLoaded", checkLoginStatus);

// Logout functionality
function logoutUser() {
    // Remove the token from localStorage to log the user out
    localStorage.removeItem("accessToken");

    // Optionally, redirect to the login page after logging out
    showToast("Logged out successfully.", "success");
    setTimeout(() => window.location.href = "login.html", 1500);
    checkLoginStatus();  // Recheck login status to update the buttons
}



// ✅ Function to show notifications using Toastify.js
function showToast(message, type = "success") {
    if (typeof Toastify !== "function") {
        console.error("🚨 Toastify.js is not loaded correctly!");
        return;
    }

    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: type === "success" ? "#28a745" : "#dc3545" },
        stopOnFocus: true,
    }).showToast();
}

function loginRedirect() {
    window.location.href = "login.html";  // Redirect to the login page
}
let allBlogs = []; // ✅ Store all blogs in memory

// ✅ Function to Fetch and Display Blog Posts
function fetchBlogs() {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        console.warn("User not logged in. Redirecting to login.");
        return;
    }

    fetch(`http://127.0.0.1:8000/api/posts/?timestamp=${new Date().getTime()}`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                showToast("Session expired! Please login again.", "error");
                localStorage.removeItem("accessToken");
                setTimeout(() => window.location.href = "login.html", 1500);
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!Array.isArray(data)) { 
            console.error("Unexpected API response:", data);
            showToast("Error fetching blogs! API issue.", "error");
            return;
        }
        allBlogs = data; // ✅ Store fetched blogs globally
        populateCategoryDropdown(); // ✅ Categories ko dropdown me add karo
        displayBlogs(allBlogs);
    })
    .catch(error => console.error("❌ Error fetching posts:", error));
}


// ✅ Function to Display Blogs
function displayBlogs(blogs) {
    const postsContainer = document.getElementById("posts");
    if (!postsContainer) return; // ✅ Prevent error if element doesn't exist

    let output = "";
    blogs.forEach(post => {
        let formattedDate = new Date(post.created_at).toLocaleDateString();
        output += `
            <div class="blog-card">
                <h2>${post.title}</h2>
                <p><strong>Category:</strong> ${post.category}</p>
                <p><strong>By:</strong> ${post.author.username} | <strong>Email:</strong> ${post.author.email}</p>
                <p><strong>Published on:</strong> ${formattedDate}</p>
                <p>${post.content.substring(0, 100)}...</p>
                <p class="read-more" onclick="openBlogDetails(${post.id})">Read More →</p>
            </div>
        `;
    });
    postsContainer.innerHTML = output;
}
function filterBlogsByCategory(selectedCategory) {
    if (!selectedCategory) {
        displayBlogs(allBlogs); // Show all blogs if no category is selected
        return;
    }

    let filteredBlogs = allBlogs.filter(post => post.category === selectedCategory);
    let otherBlogs = allBlogs.filter(post => post.category !== selectedCategory);

    let sortedBlogs = [...filteredBlogs, ...otherBlogs]; // ✅ Selected category blogs upar rahenge
    displayBlogs(sortedBlogs);
}

// ✅ Function to Populate Category Dropdown Dynamically
// ✅ Function to Populate Category Dropdown Only in Navbar
function populateCategoryDropdown() {
    const categoryDropdown = document.querySelector(".navbar #category-filter"); // ✅ Sirf navbar me dropdown target kare
    if (!categoryDropdown) return;

    let categories = new Set(allBlogs.map(post => post.category));

    categoryDropdown.innerHTML = `<option value="">All Categories</option>`;
    categories.forEach(category => {
        categoryDropdown.innerHTML += `<option value="${category}">${category}</option>`;
    });

    categoryDropdown.addEventListener("change", (event) => {
        filterBlogsByCategory(event.target.value);
    });
}


// ✅ Ensure Function Calls on Page Load
document.addEventListener("DOMContentLoaded", () => {
    fetchBlogs();
});

// ✅ Function to Store Selected Blog ID and Open Details Page
// ✅ Function to Store Selected Blog ID and Open Details Page (Fixed)
function openBlogDetails(postId) {
    if (!postId) {
        showToast("Invalid blog post!", "error");
        return;
    }
    
    localStorage.setItem("selectedPostId", postId); // ✅ Blog ID store karo
    window.location.href = `blog_details.html?postId=${postId}`; // ✅ Redirect with query parameter
}


// ✅ Function to Fetch and Display Selected Blog Details (Fixed)
function loadBlogDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    let postId = urlParams.get("postId");

    // ✅ Agar URL me ID nahi mile toh LocalStorage se le lo
    if (!postId) {
        postId = localStorage.getItem("selectedPostId");
    }

    if (!postId) {
        document.body.innerHTML = "<h2>No Blog Found</h2>";
        return;
    }

    fetch(`http://127.0.0.1:8000/api/posts/${postId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(post => {
            document.getElementById("blog-title").innerText = post.title;
            document.getElementById("blog-category").innerText = `Category: ${post.category}`;
            document.getElementById("blog-author").innerText = `By: ${post.author.username} | ${post.author.email}`;
            document.getElementById("blog-date").innerText = `Published on: ${new Date(post.created_at).toLocaleDateString()}`;
            document.getElementById("blog-content").innerText = post.content;
        })
        .catch(error => {
            console.error("❌ Error fetching blog details:", error);
            document.body.innerHTML = "<h2>Blog Not Found</h2>";
        });
}
// ✅ Ensure Blog Details Load If Page Opened



// ✅ Function to Add a New Blog Post
// ✅ Function to Add a New Blog Post (Fixed)
function addPost(event) {
    if (event) event.preventDefault();  // ✅ Prevent page reload

    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    const category = document.getElementById("blog-category").value;
    const token = localStorage.getItem("accessToken");

    if (!token) {
        showToast("Please login to add a blog post!", "error");
        setTimeout(() => window.location.href = "login.html", 1500);
        return;
    }

    if (!title || !content || !category) {
        showToast("Please fill all fields!", "error");
        return;
    }

    fetch("http://127.0.0.1:8000/api/posts/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, category })
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                showToast("Session expired! Please login again.", "error");
                localStorage.removeItem("accessToken");
                setTimeout(() => window.location.href = "login.html", 1500);
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        showToast("Blog Added Successfully!");
        fetchBlogs();
    })
    .catch(error => {
        console.error("❌ Error adding post:", error);
        showToast("Error adding post!", "error");
    });
}
document.addEventListener("DOMContentLoaded", () => {
    const addPostButton = document.getElementById("add-post-btn");
    if (addPostButton) {
        addPostButton.addEventListener("click", (event) => addPost(event));
    } else {
        console.error("🚨 Add post button not found in add_blog.html");
    }
});

// ✅ Function to Handle Login
// ✅ Function to Handle Login (Fixed)
function loginUser(event) {
    if (event) event.preventDefault();  // ✅ Prevent page reload

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
        showToast("Please enter username and password!", "error");
        return;
    }

    fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.access) {
            localStorage.setItem("accessToken", data.access);
            localStorage.setItem("username", username);
            showToast("Login Successful!");
            setTimeout(() => window.location.href = "index.html", 1000);
        } else {
            showToast("Invalid Credentials!", "error");
        }
    })
    .catch(error => showToast("Error logging in!", "error"));
}

// ✅ Fix: Use Event Listener Instead of `onclick`
document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.getElementById("login-btn");
    if (loginButton) loginButton.addEventListener("click", loginUser);
});


// ✅ Function to Handle Logout
function logoutUser() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("username");
    showToast("Logout Successful!");
    setTimeout(() => window.location.href = "login.html", 1000);
}

// ✅ Ensure Function Calls on Page Load
document.addEventListener("DOMContentLoaded", () => {
    fetchBlogs();

    const addPostButton = document.getElementById("add-post-btn");
    if (addPostButton) addPostButton.addEventListener("click", addPost);

    const loginButton = document.getElementById("login-btn");
    if (loginButton) loginButton.addEventListener("click", loginUser);
    
    const registerButton = document.getElementById("register-btn");
    if (registerButton) registerButton.addEventListener("click", registerUser);
});

// ✅ Ensure Blog Details Load If Page Opened
if (window.location.pathname.includes("blog_details.html")) {
    loadBlogDetails();
}

// ✅ Function to Handle Registration (Fixed)
function registerUser(event) {
    if (event) event.preventDefault();  // ✅ Prevent page reload

    const firstName = document.getElementById("first-name").value;
    const lastName = document.getElementById("last-name").value;
    const username = document.getElementById("new-username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
        showToast("All fields are required!", "error");
        return;
    }

    if (password !== confirmPassword) {
        showToast("Passwords do not match!", "error");
        return;
    }

    fetch("http://127.0.0.1:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, username, email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast("Registration Successful! Redirecting to Login...");
            setTimeout(() => window.location.href = "login.html", 1000);
        } else {
            showToast("Error: " + data.error, "error");
        }
    })
    .catch(error => showToast("Something went wrong!", "error"));
}
document.addEventListener("DOMContentLoaded", () => {
    const registerButton = document.getElementById("register-btn");
    if (registerButton) {
        registerButton.addEventListener("click", registerUser);
    } else {
        console.error("🚨 Register button not found in register.html");
    }
});

// ✅ Function to Search Blogs
function searchBlogs() {
    let searchQuery = document.getElementById("search-box").value.toLowerCase(); // ✅ Get search text
    let filteredBlogs = allBlogs.filter(post => 
        post.title.toLowerCase().includes(searchQuery) || 
        post.content.toLowerCase().includes(searchQuery)
    );

    if (filteredBlogs.length === 0) {
        document.getElementById("posts").innerHTML = "<h3>No results found</h3>";
    } else {
        displayBlogs(filteredBlogs); // ✅ Show filtered blogs
    }
}
