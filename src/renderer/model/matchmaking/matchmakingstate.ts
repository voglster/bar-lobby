import { MatchmakingListOkResponseData, MatchmakingQueueOkResponse, MatchmakingQueueFailResponse, MatchmakingCancelOkResponse, MatchmakingCancelFailResponse } from "tachyon-protocol/types";
import { computed, ComputedRef, reactive, shallowReactive, WatchStopHandle, ref, Ref } from "vue";

type MatchmakeState = "none" | "starting" | "searching" | "found" | "failed" | "leaving";

type Playlist = MatchmakingListOkResponseData["playlists"][0];

export class MatchmakingStateStore {
    public readonly state: Ref<MatchmakeState>;
    public readonly searchTimeStart: Ref<Date>;
    public readonly searchedPlaylists: Ref<Playlist>;
    public readonly failureMessage: Ref<string>;

    constructor() {
        this.state = ref<MatchmakeState>("none");
        this.searchTimeStart = ref(new Date());
        this.searchedPlaylists = ref([] as Array<Playlist>);
        this.failureMessage = ref("");
    }

    // Starts matchmaking against the given set of playlists
    public startQueue(playlists: Array<Playlist>) {
        if (this.state.value == "none") {
            this.setState("starting");
            this.searchedPlaylists.value = playlists;
            this.joinQueue();
        }
    }

    public stopQueue() {
        if (this.state.value != "none" && this.state.value != "leaving") {
            this.setState("leaving");
            this.leaveQueues();
        }
    }

    public onQueueUpdate() {}

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

    private async leaveQueues() {
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
        }

        console.log("Moving matchmaking state to: ", newState);
        this.state.value = newState;
    }
}
