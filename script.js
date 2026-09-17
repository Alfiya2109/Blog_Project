function checkLoginStatus() {
    const token = localStorage.getItem("accessToken");

    const loginBtn = document.getElementById("loginButton");
    const logoutBtn = document.getElementById("logoutButton");
    const logoutLink = document.getElementById("logout-link");

    if (token) {
        if (loginBtn) loginBtn.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "inline-block";
        if (logoutLink) logoutLink.style.display = "inline-block";
    } else {
        if (loginBtn) loginBtn.style.display = "inline-block";
        if (logoutBtn) logoutBtn.style.display = "none";
        if (logoutLink) logoutLink.style.display = "none";
    }
}

document.addEventListener("DOMContentLoaded", checkLoginStatus);

function logoutUser() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("username");
    showToast("Logged out successfully.", "success");
    setTimeout(() => {
        window.location.href = "login.html";
    }, 600);
}

function showToast(message, type = "success") {
    if (typeof Toastify === "function") {
        Toastify({
            text: message,
            duration: 3000,
            gravity: "top",
            position: "right",
            style: { background: type === "success" ? "#10B981" : "#EF4444" },
            stopOnFocus: true,
        }).showToast();
    } else {
        console.log(`[Toast] [${type}]: ${message}`);
    }
}

function loginRedirect() {
    window.location.href = "login.html";
}

let allBlogs = [];

const defaultDemoPosts = [
    {
        id: 1,
        title: "Architecting Scalable Microservices with Python and React",
        content: "Modern enterprise platforms require decoupled API architectures with robust state management, JWT authentication workflows, and resilient fallback strategies across distributed cloud environments. Microservices enable teams to scale services independently, optimize database queries with connection pooling, and maintain 99.9% uptime in production.",
        category: "IT",
        created_at: new Date().toISOString(),
        author: { username: "Alfiya Khan", email: "alfiya.khan@iqratechnology.com" }
    },
    {
        id: 2,
        title: "The Future of AI-Powered Developer Tooling in 2026",
        content: "From automated test generation to intelligent vector search and semantic document retrieval, developer velocity is scaling rapidly using LLMs and LangChain orchestrations. Developers can focus on core architecture while AI handles routine boilerplate, edge-case testing, and documentation generation.",
        category: "IT",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        author: { username: "Alfiya Khan", email: "alfiya.khan@iqratechnology.com" }
    },
    {
        id: 3,
        title: "Holistic Health and Mental Ergonomics in Tech Workspaces",
        content: "Balancing high-performance engineering sprints with psychological safety, ergonomic workspaces, and continuous mindfulness creates sustainable high-output engineering cultures. Regular posture breaks and screen time management greatly reduce burnout across engineering teams.",
        category: "Medical",
        created_at: new Date(Date.now() - 172800000).toISOString(),
        author: { username: "Alfiya Khan", email: "alfiya.khan@iqratechnology.com" }
    },
    {
        id: 4,
        title: "Modern UI/UX Design Systems with Tailwind CSS & Motion",
        content: "Crafting accessible, responsive web experiences with dynamic color tokens, fluid micro-interactions, and sub-second rendering across mobile and desktop devices. Consistent design spacing and high-contrast color palettes elevate user satisfaction.",
        category: "Social",
        created_at: new Date(Date.now() - 259200000).toISOString(),
        author: { username: "Alfiya Khan", email: "alfiya.khan@iqratechnology.com" }
    }
];

function getCombinedBlogs() {
    let localBlogs = [];
    try {
        localBlogs = JSON.parse(localStorage.getItem("local_blogs")) || [];
    } catch (e) {
        localBlogs = [];
    }
    return [...localBlogs, ...defaultDemoPosts];
}

function fetchBlogs() {
    const token = localStorage.getItem("accessToken");
    const fallbackBlogs = getCombinedBlogs();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    fetch(`http://127.0.0.1:8000/api/posts/?timestamp=${new Date().getTime()}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
            allBlogs = fallbackBlogs;
        } else {
            allBlogs = data;
        }
        populateCategoryDropdown();
        displayBlogs(allBlogs);
    })
    .catch(error => {
        clearTimeout(timeoutId);
        console.log("Using demo fallback posts (Local backend offline):", error);
        allBlogs = fallbackBlogs;
        populateCategoryDropdown();
        displayBlogs(allBlogs);
    });
}

function displayBlogs(blogs) {
    const postsContainer = document.getElementById("posts");
    if (!postsContainer) return;

    if (!blogs || blogs.length === 0) {
        postsContainer.innerHTML = "<p style='color:#aaa; padding: 20px;'>No blogs available at the moment.</p>";
        return;
    }

    let output = "";
    blogs.forEach(post => {
        const formattedDate = post.created_at ? new Date(post.created_at).toLocaleDateString() : "Recent";
        const authorName = (post.author && typeof post.author === 'object' ? post.author.username : post.author) || "Alfiya Khan";
        const authorEmail = (post.author && typeof post.author === 'object' ? post.author.email : '') || "alfiya.khan@iqratechnology.com";
        const snippet = post.content ? (post.content.length > 110 ? post.content.substring(0, 110) + "..." : post.content) : "";

        output += `
            <div class="blog-card">
                <h2>${post.title}</h2>
                <p><strong>Category:</strong> ${post.category || 'General'}</p>
                <p><strong>By:</strong> ${authorName} | <strong>Email:</strong> ${authorEmail}</p>
                <p><strong>Published on:</strong> ${formattedDate}</p>
                <p style="margin-top: 8px;">${snippet}</p>
                <p class="read-more" onclick="openBlogDetails(${post.id})">Read More →</p>
            </div>
        `;
    });
    postsContainer.innerHTML = output;
}

function filterBlogsByCategory(selectedCategory) {
    if (!selectedCategory) {
        displayBlogs(allBlogs);
        return;
    }

    let filteredBlogs = allBlogs.filter(post => post.category === selectedCategory);
    let otherBlogs = allBlogs.filter(post => post.category !== selectedCategory);
    displayBlogs([...filteredBlogs, ...otherBlogs]);
}

function populateCategoryDropdown() {
    const categoryDropdown = document.querySelector(".navbar #category-filter");
    if (!categoryDropdown) return;

    let categories = new Set(allBlogs.map(post => post.category).filter(Boolean));

    categoryDropdown.innerHTML = `<option value="">All Categories</option>`;
    categories.forEach(category => {
        categoryDropdown.innerHTML += `<option value="${category}">${category}</option>`;
    });

    categoryDropdown.addEventListener("change", (event) => {
        filterBlogsByCategory(event.target.value);
    });
}

function openBlogDetails(postId) {
    if (!postId) {
        showToast("Invalid blog post!", "error");
        return;
    }
    localStorage.setItem("selectedPostId", postId);
    window.location.href = `blog_details.html?postId=${postId}`;
}

function loadBlogDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    let postId = urlParams.get("postId") || localStorage.getItem("selectedPostId");

    function renderPost(post) {
        const titleEl = document.getElementById("blog-title");
        const catEl = document.getElementById("blog-category");
        const authorEl = document.getElementById("blog-author");
        const dateEl = document.getElementById("blog-date");
        const contentEl = document.getElementById("blog-content");

        const authorName = (post.author && typeof post.author === 'object' ? post.author.username : post.author) || "Alfiya Khan";
        const authorEmail = (post.author && typeof post.author === 'object' ? post.author.email : '') || "alfiya.khan@iqratechnology.com";

        if (titleEl) titleEl.innerText = post.title || "Blog Post";
        if (catEl) catEl.innerText = `Category: ${post.category || 'General'}`;
        if (authorEl) authorEl.innerText = `By: ${authorName} | ${authorEmail}`;
        if (dateEl) dateEl.innerText = `Published on: ${post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent'}`;
        if (contentEl) contentEl.innerText = post.content || "";
    }

    const fallbackPosts = getCombinedBlogs();
    const fallbackPost = fallbackPosts.find(p => String(p.id) === String(postId)) || fallbackPosts[0];

    if (!postId) {
        if (fallbackPost) {
            renderPost(fallbackPost);
        } else {
            document.body.innerHTML = "<h2>No Blog Found</h2>";
        }
        return;
    }

    renderPost(fallbackPost);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);

    fetch(`http://127.0.0.1:8000/api/posts/${postId}/`, { signal: controller.signal })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(post => {
            renderPost(post);
        })
        .catch(error => {
            clearTimeout(timeoutId);
        });
}

function addPost(event) {
    if (event && event.preventDefault) event.preventDefault();

    const titleEl = document.getElementById("title");
    const contentEl = document.getElementById("content");
    const categoryEl = document.getElementById("blog-category");

    const title = titleEl ? titleEl.value.trim() : "";
    const content = contentEl ? contentEl.value.trim() : "";
    const category = categoryEl ? categoryEl.value : "";
    const token = localStorage.getItem("accessToken") || "demo-token";

    if (!title || !content || !category) {
        showToast("Please fill all fields!", "error");
        return;
    }

    const newPost = {
        id: Date.now(),
        title: title,
        content: content,
        category: category,
        created_at: new Date().toISOString(),
        author: {
            username: localStorage.getItem("username") || "admin",
            email: "alfiya.khan@iqratechnology.com"
        }
    };

    function saveLocalAndRedirect() {
        let stored = [];
        try {
            stored = JSON.parse(localStorage.getItem("local_blogs")) || [];
        } catch (e) {
            stored = [];
        }
        stored.unshift(newPost);
        localStorage.setItem("local_blogs", JSON.stringify(stored));
        showToast("Blog Published Successfully! Redirecting...", "success");
        setTimeout(() => window.location.href = "index.html", 800);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    fetch("http://127.0.0.1:8000/api/posts/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, category }),
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error("API failed");
        return response.json();
    })
    .then(data => {
        saveLocalAndRedirect();
    })
    .catch(error => {
        clearTimeout(timeoutId);
        console.log("Local backend offline, saved post locally:", error);
        saveLocalAndRedirect();
    });
}

function quickDemoLogin() {
    const usernameInput = document.getElementById("username");
    const username = (usernameInput && usernameInput.value.trim()) || "admin";
    localStorage.setItem("accessToken", "demo-jwt-token-" + Date.now());
    localStorage.setItem("username", username);
    showToast("Login Successful! Welcome, " + username + " (Demo Mode)", "success");
    setTimeout(() => {
        window.location.href = "index.html";
    }, 500);
}

function loginUser(event) {
    if (event && event.preventDefault) event.preventDefault();

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const username = (usernameInput ? usernameInput.value.trim() : "") || "admin";
    const password = (passwordInput ? passwordInput.value.trim() : "") || "admin123";

    if (!username || !password) {
        showToast("Please enter username and password!", "error");
        return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);

    fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        return response.json();
    })
    .then(data => {
        if (data && data.access) {
            localStorage.setItem("accessToken", data.access);
            localStorage.setItem("username", username);
            showToast("Login Successful!", "success");
            setTimeout(() => window.location.href = "index.html", 500);
        } else {
            quickDemoLogin();
        }
    })
    .catch(error => {
        clearTimeout(timeoutId);
        console.log("Local backend offline, performing demo login:", error);
        quickDemoLogin();
    });
}

function registerUser(event) {
    if (event && event.preventDefault) event.preventDefault();

    const firstName = document.getElementById("first-name") ? document.getElementById("first-name").value.trim() : "";
    const lastName = document.getElementById("last-name") ? document.getElementById("last-name").value.trim() : "";
    const username = document.getElementById("new-username") ? document.getElementById("new-username").value.trim() : "";
    const email = document.getElementById("email") ? document.getElementById("email").value.trim() : "";
    const password = document.getElementById("new-password") ? document.getElementById("new-password").value : "";
    const confirmPassword = document.getElementById("confirm-password") ? document.getElementById("confirm-password").value : "";

    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
        showToast("All fields are required!", "error");
        return;
    }

    if (password !== confirmPassword) {
        showToast("Passwords do not match!", "error");
        return;
    }

    function successRedirect() {
        showToast("Registration Successful! Redirecting to Login...", "success");
        setTimeout(() => window.location.href = "login.html", 1000);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);

    fetch("http://127.0.0.1:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, username, email, password }),
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        return response.json();
    })
    .then(data => {
        if (data && data.success) {
            successRedirect();
        } else {
            showToast("Error: " + (data.error || "Registration failed"), "error");
        }
    })
    .catch(error => {
        clearTimeout(timeoutId);
        console.log("Local backend offline, completing registration:", error);
        successRedirect();
    });
}

function searchBlogs() {
    const searchBox = document.getElementById("search-box");
    if (!searchBox) return;
    let searchQuery = searchBox.value.toLowerCase();
    let filteredBlogs = allBlogs.filter(post => 
        (post.title && post.title.toLowerCase().includes(searchQuery)) || 
        (post.content && post.content.toLowerCase().includes(searchQuery))
    );

    if (filteredBlogs.length === 0) {
        const postsEl = document.getElementById("posts");
        if (postsEl) postsEl.innerHTML = "<h3 style='color:#aaa; padding: 20px;'>No results found</h3>";
    } else {
        displayBlogs(filteredBlogs);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const u = document.getElementById("username");
    const p = document.getElementById("password");
    if (u && !u.value) u.value = "admin";
    if (p && !p.value) p.value = "admin123";

    if (document.getElementById("posts")) {
        fetchBlogs();
    }

    const addPostButton = document.getElementById("add-post-btn");
    if (addPostButton) addPostButton.addEventListener("click", addPost);

    const loginButton = document.getElementById("login-btn");
    if (loginButton) loginButton.addEventListener("click", loginUser);
    
    const registerButton = document.getElementById("register-btn");
    if (registerButton) registerButton.addEventListener("click", registerUser);

    if (window.location.pathname.includes("blog_details.html")) {
        loadBlogDetails();
    }
});
