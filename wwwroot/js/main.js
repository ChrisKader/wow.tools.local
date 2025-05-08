/*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2024 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 */
const getStoredTheme = () => localStorage.getItem('theme')
const setStoredTheme = theme => localStorage.setItem('theme', theme)

const getPreferredTheme = () => {
    const storedTheme = getStoredTheme()
    if (storedTheme) {
        return storedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const setTheme = theme => {
    if (theme === 'auto') {
        document.documentElement.setAttribute('data-bs-theme', (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
    } else {
        document.documentElement.setAttribute('data-bs-theme', theme)
    }

    document.querySelectorAll('[data-bs-theme-value]').forEach(toggle => {
        /* const forTheme = toggle.getAttribute('data-bs-theme-value')
        if (forTheme == theme) {
            toggle.classList.add("active")
        } else {
            toggle.classList.remove("active")
        } */
       toggle.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    }
    );
}

const toggleTheme = () => {
    const storedTheme = getStoredTheme()
    // Toggle between dark, light and auto in that order
    if (storedTheme === 'dark') {
        setTheme('light')
        setStoredTheme('light')
    } else if (storedTheme === 'light') {
        setTheme('auto')
        setStoredTheme('auto')
    } else {
        setTheme('dark')
        setStoredTheme('dark')
    }

}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const storedTheme = getStoredTheme()
    if (storedTheme !== 'light' && storedTheme !== 'dark') {
        setTheme(getPreferredTheme())
    }
})

/* multiple modal scroll fix */
$(function() {
    $('.modal').on("hidden.bs.modal", function (e) {
        if ($('.modal:visible').length) {
            $('body').addClass('modal-open');
        }
    });

    $("#navbar").load("/header.html", function () {
        updateTitle();
        checkForUpdates();
        setTheme(getPreferredTheme())
    });

    // Tooltip for the updateButton element to show the current update status info when moused over.

    $(document).on('init.dt', function (e, settings) {
        const pageInput = document.querySelector(".dt-paging-input input");
        if (pageInput) {
            pageInput.addEventListener("keydown", (event) => {
                let intValue = parseInt(pageInput.value);
                if (event.key == "ArrowRight") {
                    pageInput.value = intValue + 1;
                } else if (event.key == "ArrowLeft" && intValue > 1) {
                    pageInput.value = intValue - 1;
                }

                pageInput.dispatchEvent(new Event('input', { bubbles: true }));
            });
        }
        [...document.querySelectorAll('[data-bs-toggle="tooltip"]')].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
        /* $("#updateButton").tooltip({
            position: {
                my: "right top",
                at: "bottom right",
                collision: "none"
            }
        }) */
    });
});

function themeClick(theme) {
    setStoredTheme(theme)
    setTheme(theme)
}



async function updateTitle() {
    if (Math.floor(Math.random() * 21) == 20) {
        document.getElementById("nocog").innerHTML = "<img src='/img/w.svg' alt='Logo W'><img src='/img/w.svg' alt='Logo W'><span>.tools <small><i>butt local</i></small></span>";
    }
}

async function checkForUpdates(force = false) {
    $("#updateButton > .spinner").toggleClass("active");
    if (document.cookie && !force) {
        newUpdateAvailable(JSON.parse(document.cookie).updateAvailable);
        return;
    }

    const latestReleaseResponse = await fetch("https://api.github.com/repos/marlamin/wow.tools.local/releases/latest");
    const latestRelease = await latestReleaseResponse.json();
    const latestReleaseTag = latestRelease.tag_name + ".0";

    const currentVersionResponse = await fetch("/casc/getVersion");
    const currentVersion = await currentVersionResponse.text();
    
    if (latestReleaseTag !== currentVersion) {
        var cookieData = new Object();
        cookieData.updateAvailable = true;
        cookieData.latestVersion = latestReleaseTag;
        document.cookie = JSON.stringify(cookieData);
        newUpdateAvailable(true);
    } else {
        var cookieData = new Object();
        cookieData.updateAvailable = false;
        cookieData.latestVersion = latestReleaseTag;
        document.cookie = JSON.stringify(cookieData);
        newUpdateAvailable(false);
    }
}

function newUpdateAvailable(isUpdateAvailable) {
    var navBar = document.getElementsByTagName("nav");
    var updateButton = document.getElementById("updateButton");

    /* var updateDiv = document.createElement("div");
    updateDiv.id = 'updateDiv';
    if (isUpdateAvailable) {
        updateDiv.innerHTML = "<i class='fa fa-exclamation-circle' style='color: red'></i> <a href='https://github.com/marlamin/wow.tools.local/releases' target='_BLANK'>An update to version " + JSON.parse(document.cookie).latestVersion + " is available!</a> <a href='#' onClick='forceUpdateCheck()'><i class='fa fa-refresh'></i></a>";
    } else {
        updateDiv.innerHTML = "<i class='fa fa-check-circle' style='color: green;'></i> Up to date. <a style='cursor: pointer' onClick='forceUpdateCheck()'><i class='fa fa-refresh'></i></a>";
    }
    navBar[0].appendChild(updateDiv); */
    $("#updateButton > .spinner").toggleClass("active");
}

function forceUpdateCheck() {
    //var element = document.getElementById("updateDiv");
    //element.parentNode.removeChild(element);
    checkForUpdates(true);
}

function renderBLPToIMGElement(url, elementID){
    fetch(url).then(function(response) {
        return response.arrayBuffer();
    }).then(function(arrayBuffer) {
        let data = new Bufo(arrayBuffer);
        let blp = new BLPFile(data);

        let canvas = document.createElement('canvas');
        canvas.width = blp.width;
        canvas.height = blp.height;

        let image = blp.getPixels(0, canvas);

        let img = document.getElementById(elementID);
        if (!img){
            console.log("Target image element does not exist: " + elementID);
            return;
        }
        img.src = canvas.toDataURL();
        img.setAttribute('data-loaded', true);
    });
}

function renderBLPToCanvasElement(url, elementID, canvasX, canvasY, resize = false) {
    return fetch(url)
        .then(function (response) {
            return response.arrayBuffer();
        })
        .then(function (arrayBuffer) {
            let data = new Bufo(arrayBuffer);
            let blp = new BLPFile(data);
            let canvas = document.getElementById(elementID);

            if (resize) {
                canvas.width = blp.width;
                canvas.height = blp.height;
            }
            let image = blp.getPixels(0, canvas, canvasX, canvasY);
        });
}

function renderBLPToCanvas(url, canvas, canvasX, canvasY) {
    return fetch(url)
        .then(function(response) {
            return response.arrayBuffer();
        })
        .then(function(arrayBuffer) {
            let data = new Bufo(arrayBuffer);
            let blp = new BLPFile(data);
            let image = blp.getPixels(0, canvas, canvasX, canvasY);
        });
}