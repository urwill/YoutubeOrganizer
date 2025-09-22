const CLIENT_ID = "361175738630-slhmgqe4dl44qa9vhtf1m68n089bogrk.apps.googleusercontent.com";
//const API_KEY = "DEIN_API_KEY";  // Optional, falls benötigt
const SCOPES = "https://www.googleapis.com/auth/drive.file";

let tokenClient;
let accessToken = null;

function authGDrive() {

    authenticate();
    

}

function authenticate() {
    gapi.load('client:auth2', () => {
        gapi.auth2.init({ client_id: CLIENT_ID }).then(() => {
            gapi.auth2.getAuthInstance().signIn();
        });
    });
}
