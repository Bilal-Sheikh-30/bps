fetch('/user/auth/check').then(response => response.json()).then(data => {
    
    if (data.loggedIn == true) {
        document.getElementById('logout-btn').style.display = 'block'
        if (data.user.userType === 'reader') {
            document.getElementById('creator-btn').style.display = 'block';
        }else{
        document.getElementById('creatorProfile-btn').style.display = 'block';
        }
    }else{
        document.getElementById('creator-btn').style.display = 'block';
    }
});