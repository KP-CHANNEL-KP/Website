// menu.js (Root Directory တွင်)

function createNavBar() {
    const navHtml = `
        <nav style="margin-bottom: 20px;">
            <a href="/free">
                <button style="background-color: #f39c12; color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 5px; margin-right: 10px;">
                    🏠 Main Page
                </button>
            </a>
            <a href="/about-us.html">
                <button style="background-color: #3498db; color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 5px;">
                    ℹ️ About Us
                </button>
            </a>
        </nav>
    `;
    
    // Menu ကို ထည့်သွင်းမည့် နေရာ (Div/Element) ကို ရွေးချယ်ပါ
    const navContainer = document.getElementById('nav-container');
    if (navContainer) {
        navContainer.innerHTML = navHtml;
    } else {
        console.error("Navigation container not found!");
    }
}

document.addEventListener('DOMContentLoaded', createNavBar);
