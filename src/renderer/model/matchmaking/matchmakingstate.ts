import {
    BattleStartRequestData,
    MatchmakingFoundEventData,
    MatchmakingFoundUpdateEventData,
    MatchmakingQueueUpdateEventData,
    MatchmakingListOkResponseData,
    MatchmakingQueueOkResponse,
    MatchmakingQueueFailResponse,
    MatchmakingCancelOkResponse,
    MatchmakingCancelFailResponse,
    MatchmakingReadyOkResponse,
    MatchmakingReadyFailResponse,
} from "tachyon-protocol/types";
import { computed, ComputedRef, reactive, shallowReactive, WatchStopHandle, ref, Ref } from "vue";

type MatchmakeState = "none" | "starting" | "searching" | "found" | "readied" | "battle-starting" | "failed" | "leaving";

type Playlist = MatchmakingListOkResponseData["playlists"][0];

export class MatchmakingStateStore {
    public readonly state: Ref<MatchmakeState>;
    public readonly searchTimeStart: Ref<Date>;
    public readonly searchedPlaylists: Ref<Array<Playlist>>;
    public readonly failureMessage: Ref<string>;
    public readonly usersInMyQueue: Ref<string | null>;
    public readonly usersReadyInFoundGroup: Ref<number | null>;
    public readonly foundPlaylistId: Ref<string | null>;
    public readonly maxReadyCount: Ref<number | null>;

    constructor() {
        this.state = ref<MatchmakeState>("none");
        this.searchTimeStart = ref(new Date());
        this.searchedPlaylists = ref([] as Array<Playlist>);
        this.failureMessage = ref("");
        this.usersInMyQueue = ref(null);
        this.usersReadyInFoundGroup = ref(null);
        this.foundPlaylistId = ref(null);
        this.maxReadyCount = ref(null);
    }

    // Starts matchmaking against the given set of playlists
    public startQueue(playlists: Array<Playlist>) {
        if (this.state.value == "none") {
            this.setState("starting");
            this.searchedPlaylists.value = playlists;
            this.joinQueue();
            //Disableed for commit, needs more work and we need to do some more front end
            //this.emulateFindGameToReadyToStart();
        }
    }

    public stopQueue() {
        if (this.state.value != "none" && this.state.value != "leaving") {
            this.setState("leaving");
            this.leaveQueuesAndFoundMatch();
        }
    }

    public cancelReadyUp() {
        this.leaveQueuesAndFoundMatch();
    }

    public readyUp() {
        this.readyUpRequest();
    }

    public onEventQueueUpdate(data: MatchmakingQueueUpdateEventData) {
        console.log("EVENT - Queue update", data);
        this.usersInMyQueue.value = data.playersQueued;
    }

    public onEventFound(data: MatchmakingFoundEventData) {
        console.log("EVENT - Found", data);
        this.foundPlaylistId.value = data.queueId;

        console.log("Checking playerlists", this.searchedPlaylists);

        const foundPlaylist = this.searchedPlaylists.value.find((searchedPlaylist) => searchedPlaylist.id == data.queueId);
        if (foundPlaylist != null) {
            this.maxReadyCount.value = foundPlaylist.numOfTeams * foundPlaylist.teamSize;
        }

        this.setState("found");
    }

    public onEventFoundUpdate(data: MatchmakingFoundUpdateEventData) {
        console.log("EVENT - Found update", data);
        this.usersReadyInFoundGroup.value = data.readyCount;
    }

    // Not implemented in tachyon protocol?
    public onEventCancelled() {
        console.log("EVENT - Cancelled");
        this.setState("none");
    }

    public onEventLost() {
        console.log("EVENT - Lost");
        this.usersReadyInFoundGroup.value = null;
        this.setState("searching");
    }

    public onEventStartBattle(data: BattleStartRequestData) {
        console.log("EVENT - Start Battle");
        this.setState("battle-starting");
    }

    private async emulateFindGameToReadyToStart() {
        console.log("STARTING AN EMULATED MATCHMAKING EXPERIENCE, WHAT YOU SEE WILL NOT BE REAL!");
        await new Promise((r) => setTimeout(r, 1000));

        //We recieve an event of how big our queue is
        this.onEventQueueUpdate({ playersQueued: "1337" });
        await new Promise((r) => setTimeout(r, 15000));

        //We recieve an event of a match being found
        this.onEventFound({ queueId: "2v2", timeoutMs: 400000 });
        this.onEventFoundUpdate({ readyCount: 0 });
        await new Promise((r) => setTimeout(r, 5000));

        //Presumably we then recieve an update event about this found situation
        this.onEventFoundUpdate({ readyCount: 1 });

        await new Promise((r) => setTimeout(r, 1000));

        //More people ready up
        this.onEventFoundUpdate({ readyCount: 2 });
        await new Promise((r) => setTimeout(r, 1000));
        this.onEventFoundUpdate({ readyCount: 3 });
        await new Promise((r) => setTimeout(r, 1000));

        //We then get the request for us to then start the battle! Huzzah!
        //this.onEventStartBattle({ username: "Ut in", password: "Ut in", ip: "Ut in", port: -57999999.99999999 });
    }

    private resetMatchmakingStats() {
        this.usersInMyQueue.value = null;
        this.usersReadyInFoundGroup.value = null;
        this.maxReadyCount.value = null;
    }

    private async joinQueue() {
        const queuesAsIds: Array<string> = [];

        this.searchedPlaylists.value.forEach((playList) => {
            queuesAsIds.push(playList.id);
        });

        if (queuesAsIds.length > 0) {
            const queueResponse: MatchmakingQueueOkResponse | MatchmakingQueueFailResponse = await api.comms.request("matchmaking/queue", { queues: [queuesAsIds[0], ...queuesAsIds.slice(1)] });

            if (queueResponse.status == "success") {
                const okResponse = queueResponse as MatchmakingQueueOkResponse;
                this.setState("searching");
            } else {
                const failResponse = queueResponse as MatchmakingQueueFailResponse;
                this.failureMessage.value = failResponse.reason;
                this.setState("failed");
            }
        }
    }

    private async readyUpRequest() {
        const cancelResponse: MatchmakingReadyOkResponse | MatchmakingReadyFailResponse = await api.comms.request("matchmaking/ready");

        if (cancelResponse.status == "success") {
            const okResponse = cancelResponse as MatchmakingReadyOkResponse;
            this.setState("readied");
        } else {
            const failResponse = cancelResponse as MatchmakingReadyFailResponse;
            this.failureMessage.value = failResponse.reason;
            this.setState("readied");
        }
    }

    private async leaveQueuesAndFoundMatch() {
        const cancelResponse: MatchmakingCancelOkResponse | MatchmakingCancelFailResponse = await api.comms.request("matchmaking/cancel");

        if (cancelResponse.status == "success") {
            const okResponse = cancelResponse as MatchmakingCancelOkResponse;
            this.setState("none");
        } else {
            const failResponse = cancelResponse as MatchmakingCancelFailResponse;
            this.failureMessage.value = failResponse.reason;

            if (failResponse.reason == "not_queued") {
                this.setState("none");
            }
        }
    }

    // Internally sets the matchmaking state
    private setState(newState: MatchmakeState) {
        if (newState == "searching") {
            this.searchTimeStart.value = new Date();
        } else if (newState == "none") {
            this.resetMatchmakingStats();
        }

        console.log("Moving matchmaking state to: ", newState);
        this.state.value = newState;
    }
}
