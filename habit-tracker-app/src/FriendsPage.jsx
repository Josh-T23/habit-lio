import {useEffect, useState, useContext} from "react";
import {
  UserPlus,
  Search,
  UserCheck,
  UserX,
  MessageCircle,
} from "lucide-react";
import "./index.css";
import "./FriendsPage.css";
import { searchUsers,
  getUserProfile,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendship} from "./firestore";
import { AuthContext } from "./AuthContext";
import { onSnapshot, collection, query, where, or, and } from "firebase/firestore";
import { db } from "./firebase";

/*
// -- Using fake information for now -----------------------------
const friends = [
  { uid: 1, name: "Alex Rivera", username: "alexrivera" },
  { uid: 2, name: "Jordan Kim", username: "jordankim" },
  { uid: 3, name: "Sam Patel", username: "sampatel" },
  { uid: 4, name: "Casey Morgan", username: "caseymorgan" },
];

const INITIAL_REQUESTS = [
  { uid: 5, name: "Taylor Swift", username: "taylorswift" },
  { uid: 6, name: "Chris Wu", username: "chriswu" },
  { uid: 7, name: "Dana Lee", username: "danalee" },
  { uid: 8, name: "Morgan Gray", username: "morgangray" },
  { uid: 9, name: "Jamie Cole", username: "jamiecole" },
  { uid: 10, name: "Reese Park", username: "reesepark" },
];

const ALL_USERS = [
  { uid: 1, name: "Alex Rivera", username: "alexrivera" },
  { uid: 2, name: "Jordan Kim", username: "jordankim" },
  { uid: 3, name: "Sam Patel", username: "sampatel" },
  { uid: 4, name: "Casey Morgan", username: "caseymorgan" },
  { uid: 5, name: "Taylor Swift", username: "taylorswift" },
  { uid: 6, name: "Chris Wu", username: "chriswu" },
  { uid: 7, name: "Dana Lee", username: "danalee" },
  { uid: 8, name: "Morgan Gray", username: "morgangray" },
  { uid: 9, name: "Jamie Cole", username: "jamiecole" },
  { uid: 10, name: "Reese Park", username: "reesepark" },
  { uid: 11, name: "Priya Nair", username: "priyanair" },
  { uid: 12, name: "Luca Bianchi", username: "lucabianchi" },
  { uid: 13, name: "Sofia Reyes", username: "sofiareyes" },
  { uid: 14, name: "Ethan Brooks", username: "ethanbrooks" },
  { uid: 15, name: "Mei Tanaka", username: "meitanaka" },
];
*/


// -----------------------------------------------------------------

const FriendCard = ({ friend, onClick }) => (
  <button className="friend-card" onClick={() => onClick(friend)}>
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "10px",
        justifyContent: "left",
        alignItems: "center",
      }}
    >
      <div id="friend-picture"></div>
      <div>
        {/* <div className="friend-card-name">{friend.name}</div> */}
        <div className="friend-card-username">@{friend.userInfo.username || friend.username}</div>
      </div>
    </div>
  </button>
);

// -- Friends List/Search -------------------------------------------------------------
const FriendsList = ({ onFriendClick, onRequestsClick, requestCount, friendList }) => {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const hasInput = search.trim().length > 0;
  useEffect(() => {
    const fetchUsers = async () => {
      if (hasInput) {
        try {
          const results = await searchUsers(search);
          setSearchResults(results);
        } catch (err) {
          console.error("Search error:", err);
        }
      } else {
        setSearchResults([]);
      }
    };
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [search, hasInput]);

  return (
    <div id="friends-page">
      <div id="search-bar-wrapper">
        <div id="search-bar">
          <button id="search-bar-requests-btn" onClick={onRequestsClick}>
            <UserPlus />
            {requestCount > 0 && (
              <span id="search-bar-requests-count">{requestCount}</span>
            )}
          </button>

          <input
            id="search-bar-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search to add friends!"
          />

          <span id="search-bar-icon">
            <Search />
          </span>
        </div>

        {hasInput && (
          <div id="search-dropdown">
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <button
                  key={user.uid}
                  className="search-dropdown-item"
                  onClick={() => {
                    onFriendClick(user);
                    setSearch("");
                  }}
                >
                  <div className="search-dropdown-info">
                    {/* <div className="search-dropdown-name">{user.name}</div> */}
                    <div className="search-dropdown-picture"></div>
                    <div className="search-dropdown-username">
                      @{user.username}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div id="search-dropdown-empty">No users found</div>
            )}
          </div>
        )}
      </div>

      <div id="friends-grid">
        {friendList.map((friend) => (
          <FriendCard
            key={friend.uid}
            friend={friend}
            onClick={onFriendClick}
          />
        ))}
      </div>
    </div>
  );
};

// -- FriendRequestsModal -------------------------------------------------------------

const FriendRequestsModal = ({
  requests,
  onClose,
  onUserClick,
  onAccept,
  onDecline,
}) => (
  <div id="requests-modal-overlay" onClick={onClose}>
    <div id="requests-modal" onClick={(e) => e.stopPropagation()}>
      <div id="requests-modal-header">
        <span id="requests-modal-title">Friend Requests</span>
        <button id="requests-modal-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div id="requests-grid">
        {requests.map((req) => (
          <button
            key={req.uid}
            className="request-card"
            onClick={() => onUserClick(req)}
          >
            <div id="request-card-wrapper">
              <div id="request-card-picture"></div>
              <div id="request-card-username">@{req.username}</div>
            </div>

            <div id="request-card-actions">
              <button
                id="request-card-accept"
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept(req.uid);
                }}
              >
                <UserCheck />
              </button>
              <button
                id="request-card-decline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDecline(req.uid);
                }}
              >
                <UserX />
              </button>
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

// -- UserProfileModal ------------------------------------------------------------------------

const UserProfileModal = ({
  user,
  isFriend,
  hasRequest,
  sendRequest,
  onClose,
  onAccept,
  onDecline,
  onRemoveFriend,
}) => (
  <div id="profile-modal-overlay" onClick={onClose}>
    <div id="profile-modal" onClick={(e) => e.stopPropagation()}>
      <button id="profile-modal-close" onClick={onClose}>
        ✕
      </button>

      <div id="profile-modal-picture"></div>

      {/* <div id="profile-modal-name">{user.name}</div> */}
      <div id="profile-modal-username">@{user.userInfo?.username || user.username}</div>

      <div id="profile-modal-actions">
        {isFriend ? ( // Clicking on a friended user
          <div style={{ display: "flex", gap: "10px", flexDirection: "row" }}>
            <button
              className="profile-btn profile-btn-remove"
              onClick={onRemoveFriend}
            >
              <UserX /> Remove Friend
            </button>

            <button className="profile-btn profile-btn-message">
              <MessageCircle />
              Message
            </button>
          </div>
        ) : hasRequest ? ( // Clicking on a user that sent a friend request to you
          <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
            <button
              className="profile-btn profile-btn-add"
              onClick={onAccept}
            >
              <UserPlus /> Accept Request
            </button>

            <button
              className="profile-btn profile-btn-remove"
              onClick={onDecline}
            >
              <UserX /> Decline Request
            </button>
          </div>
        ) : (
          // Clicking on a user that is not your friend or has not sent a friend request
          <div>
            <button
              className="profile-btn profile-btn-add"
              onClick={sendRequest}
            >
              <UserPlus />
              Add Friend
            </button>
          </div>
        )}
      </div>

      {/* Add habit analytics here */}
    </div>
  </div>
);

function FriendsPage() {
  const [selectedUser, setSelectedUser] = useState(null);
  const user = useContext(AuthContext);
  const [showRequests, setShowRequests] = useState(false);

  const [friendList, setFriendList] = useState([]);
  const [requests, setRequests] = useState([]);

  // Needs set up with firestore
  //const handleAccept  = id => setRequests(r => r.filter(req => req.id !== id));
  //const handleDecline = id => setRequests(r => r.filter(req => req.id !== id));
  useEffect(() => {
    if (!user) return;

    // 1. Listen for Accepted Friends
    const friendsQuery = query(
        collection(db, "friendships"),
        and(
            where("status", "==", "accepted"),
            or(
                where("requesterId", "==", user.uid),
                where("receiverId", "==", user.uid)
            )
        )
    );

    const unsubFriends = onSnapshot(friendsQuery, async (snapshot) => {
      const friendPromises = snapshot.docs.map(async (d) => {
        const data = d.data();
        const friendId = data.requesterId === user.uid ? data.receiverId : data.requesterId;
        const profile = await getUserProfile(friendId);
        if (!profile) return null;
        return { friendshipId: d.id, ...profile };
      });
      const results = await Promise.all(friendPromises);
      setFriendList(results.filter(p => p !== null));
    });

    // 2. Listen for Incoming Pending Requests
    const requestsQuery = query(
        collection(db, "friendships"),
        and(
          where("receiverId", "==", user.uid),
          where("status", "==", "pending")
        )
    );

    const unsubRequests = onSnapshot(requestsQuery, async (snapshot) => {
      const requestPromises = snapshot.docs.map(async (d) => {
        const profile = await getUserProfile(d.data().requesterId);
        return { friendshipId: d.id, ...profile };
      });
      setRequests(await Promise.all(requestPromises));
    });

    return () => { unsubFriends(); unsubRequests(); };
  }, [user]);

  const isFriend = (uid) => friendList.some((f) => f.uid === uid);
  const hasRequest = (uid) => requests.some((r) => r.uid === uid);

  return (
    <div style={{ minWidth: "75vh" }}>
      <FriendsList
        onFriendClick={setSelectedUser}
        onRequestsClick={() => setShowRequests(true)}
        requestCount={requests.length}
        friendList={friendList}
      />

      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          isFriend={isFriend(selectedUser.uid)}
          hasRequest={hasRequest(selectedUser.uid)}
          onClose={() => setSelectedUser(null)}
          sendRequest={() => sendFriendRequest(user.uid, selectedUser.uid)}
          onAccept={() => {
            const req = requests.find(r => r.uid === selectedUser.uid);
            if (req) acceptFriendRequest(req.friendshipId);
          }}
          onDecline={() => {
            const req = requests.find(r => r.uid === selectedUser.uid);
            if (req) removeFriendship(req.friendshipId);
          }}
          onRemoveFriend={() => {
            const friend = friendList.find(f => f.uid === selectedUser.uid);
            if (friend) removeFriendship(friend.friendshipId);
          }}
        />
      )}

      {showRequests && (
        <FriendRequestsModal
          requests={requests}
          onClose={() => setShowRequests(false)}
          onUserClick={setSelectedUser}
          onAccept={(uid) => {
            const req = requests.find(r => r.uid === uid);
            acceptFriendRequest(req.friendshipId);
          }}
          onDecline={(uid) => {
            const req = requests.find(r => r.uid === uid);
            removeFriendship(req.friendshipId);
          }}
        />
      )}
    </div>
  );
}

export default FriendsPage;
