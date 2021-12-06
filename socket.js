
var audio = document.getElementById('tets')
var isplaying = false
var connection = document.getElementById("connectionStream")
var parent_block = document.getElementById("parent-block")

var playerStatus = document.getElementById("statusPlaying")
var streamAnimation = document.getElementById("streamAnimation")
var otpField = document.getElementById("otpField")

var socket, samplerate
var isListening = false;
var isplaying = false;
var player;
var dbInitialized = false;
var temp = [];
var temp_length = 0;
const clicked = () => { 
    try {
        if (isplaying) {
            playerStatus.innerText = "STOP"
        } else {
            playerStatus.innerText = "PLAY"
        }
        isplaying = !isplaying; 
    } catch (error) {
        console.log("there was some problem");
    }
}
// prepare data for web socker 


const startStreaming = () => {
    var one = document.getElementById("digit-1").value
    var two = document.getElementById("digit-2").value
    var three = document.getElementById("digit-3").value
    var four = document.getElementById("digit-4").value
    var five = document.getElementById("digit-5").value
    var six = document.getElementById("digit-6").value
    var myotp = one + two + three + four + five + six
    // check for all length less than 1
    if (myotp.length < 6) {
        alert("please enter valid otp")
    } else {
        otp = parseInt(myotp)
        if (!dbInitialized) {
            const firebaseConfig = {
                apiKey: "AIzaSyDHSWGfEsuerR2d8I1SygVWCWosTsvMvGM",
                authDomain: "fifth-ventricle-01.firebaseapp.com",
                projectId: "fifth-ventricle-01",
                storageBucket: "fifth-ventricle-01.appspot.com",
                messagingSenderId: "320168687856",
                appId: "1:320168687856:web:41633be8b37b4e26e2aa35",
                measurementId: "G-N6GV6RJY0K"
            };

            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);


            dbInitialized = true;
        }

        var db = firebase.firestore();
        var docRef = db.collection("streams").where('otp', '==', otp).orderBy("timestamp", "desc").limit(1);

        docRef.get().then((doc) => {
            // console.log("Document data:", doc.docs[0].data());
            if (doc.docs.length > 0) {
                var data = doc.docs[0].data();
                socketCall(data['streamId'],data['streamURL']);
            } else {
                // doc.data() will be undefined in this case
                alert("Please enter valid otp")
                window.location.reload()
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });

    }

}
const socketCall = (streamId,streamURL) => {
    connection.innerText = "Connecting" ;
    const URL = streamURL!=null?streamURL:"wss://stream.fifthventricle.in/";
    socket = new WebSocket("wss://stream.fifthventricle.in");
    socket.onopen = (e) => {
        var id = Math.random().toString();
        socket.send(JSON.stringify({
            "meta": "join_room",
            "message": "hello world",
            "clientID": id,
            "roomID": streamId
        }));
    }

    socket.onclose = (e) => { 
        connection.innerText = "Closed"
    }

    socket.onerror = () => { 
        connection.innerText = "Try again"
    }

    socket.onmessage = (e) => {
        // get byte data and create the blob object
        var data = JSON.parse(e.data) 
        if (Array.isArray(data.message)) {
            var convertedData = new Uint8Array(data.message);
            // console.log("converted data recieved",convertedData);
            // for(let j=0;j<convertedData.length;j++){
            //     if(temp_length>1000){
            //         player.feed(temp);
            //         temp_length=0;
            //         temp=[];
            //     }else{
            //         temp.push(convertedData[j]);
            //         temp_length++;
            //     }
            // }
            player.feed(convertedData);
        }
        else if (data.message == 'Check room id') {
            alert("Please enter a valid OTP ")
            window.location.reload()
        }
        else if (data.status == 2) {
            alert("Streaming closed by the admin")
            window.location.reload()
        }
        else {
            if (data.status == 1) {
                hideElement()
                connection.innerText = "Disconnect"
                isplaying = true
                samplerate = data.srat
                player = new PCMPlayer({
                    encoding: '16bitInt',
                    channels: 1,
                    sampleRate: samplerate,
                    flushingTime: 200
                });
                playerStatus.innerText = "PAUSE"
            }
        }

    }

}

const stopStreaming = () => {
    socket.close()
    window.location.reload()
}

const pauseStreaming = () => {
    player.volume(0)
}

const resumeStreaming = () => {
    player.volume(1)
}

const toggleStreaming = () => {
    if (isListening) {
        stopStreaming();
    } else {
        startStreaming();
    }
    isListening = !isListening;
}

const togglePlay = () => {
    if (isListening) {
        if (isplaying) {
            pauseStreaming();
            playerStatus.innerText = "PLAY"
        } else {
            resumeStreaming();
            playerStatus.innerText = "PAUSE"
        }
        isplaying = !isplaying;
    }
}

const hideElement = () => {
    if (isListening) {  // if streaming is on
        $("#streamAnimation").show();
        $("#otpField").hide();

    } else {    // if streaming is off
        $("#streamAnimation").hide();
        $("#otpField").show();
    }
}

hideElement()