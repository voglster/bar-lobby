import { MatchmakingListOkResponseData } from "tachyon-protocol/types";
import { computed, ComputedRef, reactive, shallowReactive, WatchStopHandle, ref, Ref } from "vue";

type MatchmakeState = "none" | "searching" | "found" | "failed";

export class MatchmakingStateStore {
    public readonly state: Ref<MatchmakeState>;
    public readonly searchTimeStart = ref(new Date());
    public readonly searchedPlaylists = ref([] as Array<MatchmakingListOkResponseData["playlists"]>);

    constructor() {
        this.state = ref<MatchmakeState>("none");
    }

    // Starts matchmaking against the given set of playlists
    public startQueue(playlists: Array<MatchmakingListOkResponseData["playlists"]>) {
        this.setState("searching");
        this.searchedPlaylists.value = playlists;
    }

    public stopQueue() {
        this.setState("none");
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
