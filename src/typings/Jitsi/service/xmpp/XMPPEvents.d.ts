 export const enum XMPPEvents {
  ADD_ICE_CANDIDATE_FAILED ="xmpp.add_ice_candidate_failed",
  AUDIO_MUTED_BY_FOCUS ="xmpp.audio_muted_by_focus",
  VIDEO_MUTED_BY_FOCUS ="xmpp.video_muted_by_focus",
  AUTHENTICATION_REQUIRED ="xmpp.authentication_required",
  BRIDGE_DOWN ="xmpp.bridge_down",
  CALL_ACCEPTED ="xmpp.callaccepted.jingle",
  CALL_INCOMING ="xmpp.callincoming.jingle",
  CALL_ENDED ="xmpp.callended.jingle",
  CHAT_ERROR_RECEIVED ="xmpp.chat_error_received",
  CONFERENCE_PROPERTIES_CHANGED ="xmpp.conference_properties_changed",
  CONNECTION_ESTABLISHED ="xmpp.connection.connected",
  CONNECTION_FAILED ="xmpp.connection.failed",
  CONNECTION_INTERRUPTED ="xmpp.connection.interrupted",
  CONNECTION_RESTORED ="xmpp.connection.restored",
  CONNECTION_ICE_FAILED ="xmpp.connection.ice.failed",
  CONNECTION_RESTARTED ="xmpp.connection.restart",
  CONNECTION_STATUS_CHANGED ="xmpp.connection.status.changed",
  DISPLAY_NAME_CHANGED ="xmpp.display_name_changed",
  EMUC_ROOM_ADDED ="xmpp.emuc_room_added",
  EMUC_ROOM_REMOVED ="xmpp.emuc_room_removed",
  ETHERPAD ="xmpp.etherpad",
  FOCUS_DISCONNECTED ="xmpp.focus_disconnected",
  FOCUS_LEFT ="xmpp.focus_left",
  GRACEFUL_SHUTDOWN ="xmpp.graceful_shutdown",
  ICE_RESTARTING ="rtc.ice_restarting",
  ICE_RESTART_SUCCESS ="rtc.ice_restart_success",
  KICKED ="xmpp.kicked",
  LOCAL_ROLE_CHANGED ="xmpp.localrole_changed",
  MEETING_ID_SET ="xmpp.meeting_id_set",
  MESSAGE_RECEIVED ="xmpp.message_received",
  INVITE_MESSAGE_RECEIVED ="xmpp.invite_message_received",
  PRIVATE_MESSAGE_RECEIVED ="xmpp.private_message_received",
  MUC_MEMBER_BOT_TYPE_CHANGED ="xmpp.muc_member_bot_type_changed",
  MUC_DESTROYED ="xmpp.muc_destroyed",
  MUC_JOINED ="xmpp.muc_joined",
  MUC_MEMBER_JOINED ="xmpp.muc_member_joined",
  MUC_MEMBER_LEFT ="xmpp.muc_member_left",
  MUC_LOBBY_MEMBER_JOINED ="xmpp.muc_lobby_member_joined",
  MUC_LOBBY_MEMBER_UPDATED ="xmpp.muc_lobby_member_updated",
  MUC_LOBBY_MEMBER_LEFT ="xmpp.muc_lobby_member_left",
  MUC_DENIED_ACCESS ="xmpp.muc_denied access",
  MUC_LEFT ="xmpp.muc_left",
  MUC_ROLE_CHANGED ="xmpp.muc_role_changed",
  MUC_LOCK_CHANGED ="xmpp.muc_lock_changed",
  MUC_MEMBERS_ONLY_CHANGED ="xmpp.muc_members_only_changed",
  PARTICIPANT_AUDIO_MUTED ="xmpp.audio_muted",
  PARTICIPANT_VIDEO_MUTED ="xmpp.video_muted",
  PARTICIPANT_VIDEO_TYPE_CHANGED ="xmpp.video_type",
  PARTICIPANT_FEATURES_CHANGED ="xmpp.participant_features_changed",
  PASSWORD_REQUIRED ="xmpp.password_required",
  PHONE_NUMBER_CHANGED ="conference.phoneNumberChanged",
  PRESENCE_RECEIVED ="xmpp.presence_received",
  PRESENCE_STATUS ="xmpp.presence_status",
  PROMPT_FOR_LOGIN ="xmpp.prompt_for_login",
  READY_TO_JOIN ="xmpp.ready_to_join",
  RECORDER_STATE_CHANGED ="xmpp.recorderStateChanged",
  REMOTE_STATS ="xmpp.remote_stats",
  RENEGOTIATION_FAILED ="xmpp.renegotiation_failed",
  RESERVATION_ERROR ="xmpp.room_reservation_error",
  ROOM_CONNECT_ERROR ="xmpp.room_connect_error",
  ROOM_CONNECT_NOT_ALLOWED_ERROR ="xmpp.room_connect_error.not_allowed",
  ROOM_JOIN_ERROR ="xmpp.room_join_error",
  ROOM_CONNECT_MEMBERS_ONLY_ERROR ="xmpp.room_connect_error.members_only",
  ROOM_MAX_USERS_ERROR ="xmpp.room_max_users_error",
  SENDING_CHAT_MESSAGE ="xmpp.sending_chat_message",
  SENDING_PRIVATE_CHAT_MESSAGE ="xmpp.sending_private_chat_message",
  SESSION_ACCEPT_TIMEOUT ="xmpp.session_accept_timeout",
  SPEAKER_STATS_RECEIVED ="xmpp.speaker_stats_received",
  CONFERENCE_TIMESTAMP_RECEIVED ="xmpp.conference_timestamp_received",
  START_MUTED_FROM_FOCUS ="xmpp.start_muted_from_focus",
  SUBJECT_CHANGED ="xmpp.subject_changed",
  SUSPEND_DETECTED ="xmpp.suspend_detected",
  TRANSCRIPTION_STATUS_CHANGED ="xmpp.transcription_status_changed",
  TRANSPORT_INFO ="xmpp.transportinfo.jingle",
  VIDEO_SIP_GW_AVAILABILITY_CHANGED ="xmpp.videoSIPGWAvailabilityChanged",
  VIDEO_SIP_GW_SESSION_STATE_CHANGED ="xmpp.videoSIPGWSessionStateChanged",
  ICE_CONNECTION_STATE_CHANGED ="xmpp.ice_connection_state_changed",
  JSON_MESSAGE_RECEIVED ="xmmp.json_message_received"
}
