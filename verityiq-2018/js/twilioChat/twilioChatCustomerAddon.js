var chatGlobalClient;
var globalChannelSid = '';
var globalCustomerIdentity = '';
var globalChannelUniqueName = '';
var globalPrivateChannelSid = '';
var connectedChatChannels = []; //Connected Channels
var globalSchoolId = 19; // SCHOOL ID SHOULD ALREADY BE PROVIDED. SITE IS ON A SCHOOL SCOPE.CAMPUS WILL BE LATER DECIDED.  ID 19 = BrowardUniversity IN DEV
var globalCampusId = "";  // Campus SelectedID
var globalProgramOfInterestId = ""; // Program Of Interest Selected ID
var globalCampusName = "";
var globalCustomerName = "";
var globalInitialMessage = "";
var globalCustomerEmail ="";  // Customer Email

var testingDomainURLPrepend ="http://debug2.ngrok.io"; // https://dev.verityiq.com  http://debug2.ngrok.io/ IS USED ONLY FOR TESING PURPOSES.!!!!!
 
$(function () {
    // Interface to the Twilio Chat service
    var chatClient;

    function initiateChatCustomerClient()
    {
        // Get an access token for the current user, passing a username (identity)
        // and a device ID - for browser-based apps, we'll always just use the
        // value "browser"

        
        $.getJSON(testingDomainURLPrepend  + '/ChatCustomer/GetTokenForCustomer', {
            device: 'browser'
        }, function (data) {
           
            if(data.status == "1")
            {
               //globalCustomerName = data.username;
               globalCustomerIdentity = data.identity;
               // Initialize the Chat client
               chatClient = new Twilio.Chat.Client(data.token);
               chatGlobalClient = chatClient;
               setTimeout(function()
               {
                   initiateChatCustomerClient(); //To Refresh token before expiration before 1 hour
               }, 3500000);
            
               chatClient.getSubscribedChannels().then(createOrJoinChannels);

               //SHOW THE USER ENGAGED DIV AND HIDE THE INITIATE CHAT DIV
               $("#verity_chat_client_form_inner").hide();
               $("#verity_chat_client_user-engadged").show();
               


               $("[chat-content-customer] .modal-body").removeClass("hidden");
               $("[start-chat-customer]").hide();
               $("[data-send-chat-customer]").show();
               $("[data-clear-chat-customer]").show();
               $("#customer-chat-textarea").val('');
               $("#CustomerName").attr("disabled", "disabled");
            }
        });
    }

    function createOrJoinChannels(e) {
        chatClient.on('channelJoined', function (newChannel) {
            if (newChannel.uniqueName.toLowerCase().includes("teamid"))
                return;

            globalChannelUniqueName = newChannel.uniqueName;
            globalPrivateChannelSid = newChannel.sid;
            setupChannel(newChannel);
        });
    }

    // Set up channel after it has been found
    function setupChannel(connectedChannel) {
        if (connectedChannel) {
            connectedChatChannels.push(connectedChannel);
            //CREATE LISTENERS FOR THIS CHANNEL HERE:
            // Listen for new messages sent to the channel
            connectedChannel.on('messageAdded', function (message) {
            
                var channelUniqueName = message.channel.uniqueName;
                var channelSid = message.channel.sid;
                var messageAuthor = message.author;
                var messageBody = message.body;
                var messageDate = message.timestamp;


                if (message.attributes && message.attributes.advisorJoined)
                {
                    // Then its a response that an advisor Joined the chat (responded)

                    if (message.attributes.advisorImageSrc && $("#advisor-avatar-image").length > 0) {
                        //Set the Image URl into the Image placeholder
                        $("#advisor-avatar-image")[0].src = message.attributes.advisorImageSrc;
                    }
                    else
                    {
                        //Set the advisor initials inside the image bubble
                    }

                    if (message.attributes.advisorName && $("#advisor-name").length > 0)
                    {
                        $("#advisor-name").text(message.attributes.advisorName);
                    }
                }

                if (globalCustomerIdentity != messageAuthor && channelSid == globalPrivateChannelSid && (messageAuthor.toLowerCase().includes("userid") || messageAuthor.toLowerCase()== "system"))
                {
                    $(".typing-indicator").remove();
                    sendChatMessage(messageBody, false,false);
                }
            });
            
            //set up the listener for the typing started Channel event
                connectedChannel.on('typingStarted', function(member) {
                            debugger;
                            //Append the TYPING INDICATOR
                            $(".sms-chat-customer").append($.parseHTML('<div class="typing-indicator">Advisor is typing...</div>'))
                            });

               //set  the listener for the typing ended Channel event
              connectedChannel.on('typingEnded', function(member) {
              //REMOVE the TYPING INDICATOR
              debugger;
              $(".typing-indicator").remove();
              });
        }
    }

    /////////////////NEW!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    $(document.body).on("mouseover", ".chat-customer-footer", function () {
        $(".verity_chat_exit_chat").fadeOut();
    });

    $(document.body).on("click", "p.exit-menu_icons", function () {
        $(".verity_chat_exit_chat").toggle();
    });
    $(document.body).on("click", ".verity_chat_exit_chat button", function () {
        $(".verity_chat_exit_chat").toggle();
        $(".chat-message-wrapper").fadeOut();
        $(".verity_chat_client_resolve-chat").fadeIn();
        $("#verity_chat_client_message_submission_text_area").fadeOut();

    });
    $(document.body).on("click", "#conversationContainer", function () {
        $(".verity_chat_exit_chat").fadeOut();
    });

    $(document.body).on("click", "#verity_chat_client_start-chat-button", function () {
        $("#verity_chat_client_form_wrapper").css("background", "white");
    })
    $(document.body).on("click", "#VerityStartChatButton", function () {
        $(this).fadeOut();
        $("#verity_chat_client_form_wrapper").fadeIn();
        $("button#closeVerityChatButton").fadeIn();
    })
    $(document.body).on("click", "button#closeVerityChatButton", function () {
        $("#verity_chat_client_form_wrapper").fadeOut();
        $("button#closeVerityChatButton").fadeOut();
        $("button#VerityStartChatButton").fadeIn();

    })
    /////////////////NEW!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    $(document.body).on("click", "[start-chat-customer]", function () {
        //globalSchoolId = 19; // SCHOOL ID SHOULD ALREADY BE PROVIDED. SITE IS ON A SCHOOL SCOPE.CAMPUS WILL BE LATER DECIDED.  ID 19 = BrowardUniversity IN DEV
        globalCampusId =$("#selected-campus").val();
        globalProgramOfInterestId =$("#selected-program-of-interest").val();
        globalCustomerEmail  = $("#customer-email").val();
        globalCustomerName  = $("#customer-name").val();

        
        if(globalCustomerName)
        {
           initiateChatCustomerClient();
        }
        else{//can provide validations if custumer name was not provided
        // TODO : IMPLEMENT VALIDATIONS FOR CUSTOMER NAME
        }
    });
    
    $(document.body).on("click","[end-chat-customer]",function(e)
    {
     debugger;
     ///Leave Conversation
     $.ajax(testingDomainURLPrepend  +'/TwilioChat/MemberLeaveChatChannel?channelSid=' + encodeURIComponent(globalPrivateChannelSid) + '&userIdentity=' + chatGlobalClient.user.state.identity + '&fromCustomer='+ true)
                               .done(function (data) {
                                 debugger;
                                 //If left channel , hide the conversation AND RESET VARIABLES FOR CHANNEL SID, CUSTOMER IDENTITY.
                               });
    });

    $(document.body).on("click", "[data-send-chat-customer] , [campus-selected]", function (e) {
        globalCampusId =$("#selected-campus").val();
        globalCampusName = $("#selected-campus option:selected").text();
        globalProgramOfInterestId =$("#selected-program-of-interest").val();
        globalCustomerEmail  = $("#customer-email").val();
        globalCustomerName  = $("#customer-name").val();
        
        
        var isInitialMessageTag = $('.initial-message')[0];
        //var sendsUsername =  $('.sends-username');

        var newMessage = $("#customer-chat-textarea").val();
        
        //if(sendsUsername.length > 0  && newMessage )
        //{
        // $.ajax({
        //        type: 'POST',
        //        data: {
        //            initialMessage: true,
        //            customerIdentity: globalCustomerIdentity,
        //            messageBody: newMessage? newMessage : globalInitialMessage, 
        //            schoolId : globalSchoolId,
        //            campusId: globalCampusId,
        //            programOfInterestId : 
        //        },
        //        url: testingDomainURLPrepend +'/ChatCustomer/UpdateCustomerUsername?userName='+newMessage +'&customerIdentity='+globalCustomerIdentity,
        //        cache: false
        //    })
        //    //remove the send username class
        //    //$('.sends-username').removeClass("sends-username");
        //    $("#customer-chat-textarea")[0].placeholder="Enter text";
        //}
        
        if (isInitialMessageTag || connectedChatChannels.length == 0 )
        {
            if(newMessage)
            {
            globalInitialMessage = newMessage;
            }
            //SEND MESSAGE TO SERVER.INITIAL MESSAGE TO TEAM!
            $.ajax({
                type: 'POST',
                data: {
                    customerIdentity: globalCustomerIdentity,
                    messageBody: newMessage? newMessage : globalInitialMessage, 
                    schoolId : globalSchoolId,
                    campusId: globalCampusId,
                    programOfInterestId : globalProgramOfInterestId,
                    customerEmail : globalCustomerEmail,
                    customerName : globalCustomerName,
                },
                url: testingDomainURLPrepend +'/TwilioChat/MessageFromCustomer',
                cache: false
            })
            .done(function (data) {
            //if(data.status =="2") //An automated response came from the server.
            //{
            //Please provide Campus
            //
            // $.ajax({
            //    type: 'GET',
            //    data: {
            //        schoolId : globalSchoolId
            //    },
            //    url: testingDomainURLPrepend +'/ChatCustomer/GetCampusesBySchool',
            //    cache: false
            //})
            //.done(function (data) {
            //  for (var i = 0; i < data.length; i++) {
            //    var select = document.getElementById("CampusSelect");
            //    var option = document.createElement("option");
            //    option.text = data[i].Text;
            //    option.value = data[i].Value;
            //    select.add(option);
            //}
            //  //POPULATE THE CAMPUS DROPDOWN WITH THE OPTIONS
            //  $("#CampusSelect").show();
            //  $("#CampusLabel").show();
            //  $("[campus-selected]").show()
            // });
            //}
            if(data.status == "1") //Passed initial check and message was sent to the TEAM
            {
              //REMOVE INITIAL MESSAGE CLASS and Clear Textarea.
              $(isInitialMessageTag).removeClass("initial-message");
              $("#customer-chat-textarea").val('');
               
              ////HIDE THE CAMPUS DROPDOWN 
              //$("#CampusSelect").hide();
              //$("#CampusLabel").hide();
              //$("[campus-selected]").hide();
              //$("[end-chat-customer]").show();
              
              //ACTIVATE THE SENDS USERNAME TAG
              //$("#customer-chat-textarea").addClass("sends-username");
              //$("#customer-chat-textarea")[0].placeholder="Please enter your name";
            }  
          });
            sendChatMessage(globalCampusName , true, true);
        }
        else
        {
            //CHAT NORMALLY ON THE PRIVATE CHAT ROOM.
            sendChatMessage(newMessage, true,false)
        }
    });
    
    $(document.body).on("click", "[data-clear-chat-customer]", function (e) {
        $("#customer-chat-textarea")[0].val(''); //Clear the typing texarea if cancel was clicked.
    });
    
    $(document.body).on("keydown", "#customer-chat-textarea", function (e) {
        if (e.keyCode == 13) {
            $("[data-send-chat-customer] ").trigger("click");
        }
        else {
            debugger;
            // else send the Typing Indicator signal
            connectedChatChannels.forEach(function(el)
            {
                el.typing();
            });
        }
    });

    function sendChatMessage(newMessage, fromCustomer, isInitialText) {
        //  var $input = $('[data-send-chat]');
        // $input.on('keydown', function (e) {

        if (globalPrivateChannelSid && globalCustomerIdentity)
        {
            $.ajax({
                type: 'POST',
                data: {
                    advisorIdentity: '',
                    customerIdentity: globalCustomerIdentity,
                    privateChannelSid: globalPrivateChannelSid,
                    messageBody: newMessage,
                    fromCustomer: fromCustomer,
                    isgetOnly : !fromCustomer
                },
                url: testingDomainURLPrepend + '/TwilioChat/SaveMessageToConversation',
                cache: false
            })
          .done(function (data) {
              debugger;
              $(".sms-chat-customer").append($(data))
              // DB UPTATED WITH THE NEW MESSAGE.
          });
        }

        if (fromCustomer) {
            var channelFound = connectedChatChannels.find(function (element) {
                return element.sid == globalPrivateChannelSid;
            });
            if (channelFound) {
                channelFound.sendMessage(newMessage,{isUsernameInput: false});
            }
            if(!isInitialText)
            {
                $("#customer-chat-textarea").val('');
            }            
        }
    };
});