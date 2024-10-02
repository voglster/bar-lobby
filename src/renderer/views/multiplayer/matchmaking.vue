<route lang="json5">
{ meta: { title: "Matchmaking", order: 0, devOnly: true, availableOffline: false, transition: { name: "slide-left" } } }
</route>

<template>
    <div class="flex-col gap-md flex-grow">
        <Transition name="fade" mode="out-in">
            <div v-if="!isMatchMaking" class="flex-col gap-md flex-grow">
                <h2>Modes</h2>
                <Transition>
                    <div v-if="!fetchingPlaylists">
                        <div class="flex-row flex-wrap gap-xl">
                            <Card
                                :is-selected="selectedMode == 'ranked'"
                                v-on:tap="selectedMode != 'ranked' ? (selectedMode = 'ranked') : (selectedMode = 'none')"
                                class="card-height flex-grow"
                                :background-img-url="rankedImage"
                                style-type="cover"
                                title="Ranked"
                            >
                                <p>Compete in structured matches to earn points and improve your rank.</p>
                            </Card>
                            <Card
                                :is-selected="selectedMode == 'casual'"
                                v-on:tap="selectedMode != 'casual' ? (selectedMode = 'casual') : (selectedMode = 'none')"
                                class="card-height flex-grow"
                                :background-img-url="casualImage"
                                style-type="cover"
                                title="Casual"
                            >
                                <p>Enjoy relaxed matches without pressure.</p>
                            </Card>
                            <Card
                                :is-selected="selectedMode == 'co-op'"
                                v-on:tap="selectedMode != 'co-op' ? (selectedMode = 'co-op') : (selectedMode = 'none')"
                                class="card-height flex-grow"
                                :background-img-url="raptorsImage"
                                style-type="cover"
                                title="Co-op"
                            >
                                <p>Collaborate to defeat powerful robots & monsters.</p>
                            </Card>
                        </div>
                        <Transition>
                            <div class="flex-row flex-wrap gap-md" v-if="activeQueueGroup != null">
                                <TransitionGroup>
                                    <Card
                                        v-for="(playlist, innerIndex) in activeQueueGroup.playLists"
                                        :key="innerIndex"
                                        :is-selected="selectedPlaylists.includes(playlist.key)"
                                        v-on:tap="onTapPlaylist(playlist.key)"
                                        >{{ playlist.name }}</Card
                                    >
                                </TransitionGroup>
                            </div>
                        </Transition>
                        <div class="flex-row">
                            <div class="flex-col flex-2">
                                <Transition>
                                    <div v-if="activeDescription" class="flex-row flex-grow">
                                        {{ activeDescription.description }}
                                    </div>
                                </Transition>
                            </div>
                            <div class="flex-col flex-1"></div>
                        </div>
                        <div class="flex-row">
                            <div v-if="activeDescription" class="flex-row flex-grow"></div>
                        </div>
                    </div>
                    <div v-else><Loader /></div>
                </Transition>
                <div class="flex-row flex-grow flex-align-end flex-justify-end">
                    <h4><Card @click="onTapQueue" :disabled="actualSelectedPlaylistIds.length == 0">Play</Card></h4>
                </div>
            </div>
            <div v-else class="flex-col gap-md flex-grow flex-center-content">
                <div></div>
                <div class="flex-row flex-center-content">
                    <div class="flex-col gap-lg">
                        <div class="flex-row flex-center-content">
                            <h5>Searching...</h5>
                        </div>
                        <div class="flex-row flex-center-content">
                            <div v-if="usersInQueue">{{ usersInQueue }} users in queue.</div>
                        </div>
                        <div class="flex-row flex-center-content gap-lg">
                            <Card v-for="(playlist, index) in queuedPlaylists" :key="index">{{ playlist.name }}</Card>
                        </div>
                        <div class="flex-row flex-center-content">
                            <Loader :absolutePosition="false" />
                        </div>
                        <div class="flex-row flex-center-content">
                            <p>Queue time : {{ displayedTimeSearching }}</p>
                        </div>
                        <div class="flex-row flex-center-content">
                            <Button @click="onTapStopQueue">Stop</Button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script lang="ts" setup>
import rankedImage from "@/assets/images/backgrounds/1.png";
import casualImage from "@/assets/images/backgrounds/2.jpg";
import raptorsImage from "@/assets/images/backgrounds/3.png";
import { MatchmakingListOkResponse, MatchmakingListOkResponseData } from "tachyon-protocol/types";
import Loader from "@/components/common/Loader.vue";

import { ref, onMounted, onUnmounted, computed, watch } from "vue";

import Card from "@/components/common/Card.vue";
import Button from "@/components/controls/Button.vue";

interface PlaylistGroup {
    identifier: "none" | "ranked" | "casual" | "co-op";
    playLists: Array<PlayListGroupItem>;
}

interface PlayListGroupItem {
    key: string;
    name: string;
}

type PlaylistInfo = MatchmakingListOkResponseData["playlists"][0];

const selectedMode = ref<"none" | "ranked" | "casual" | "co-op">("none");
const playlistGroups = ref<Array<PlaylistGroup>>([] as Array<PlaylistGroup>);
const selectedPlaylists = ref<Array<string>>([] as Array<string>);
const fetchingPlaylists = ref<boolean>(true);
const actualPlaylists = ref<Array<PlaylistInfo>>([] as Array<PlaylistInfo>);
const displayedTimeSearching = ref<String>("");

let timerUpdateId: number;

const modeDescriptions = [
    {
        mode: "none",
        description: "Please select a mode to play",
    },
    {
        mode: "ranked",
        description:
            "Ranked Mode offers competitive matchmaking where players face off based on skill, earning ranks and rewards by winning against similarly skilled opponents.",
    },
    {
        mode: "casual",
        description:
            "Casual Mode provides relaxed matchmaking for players to enjoy non-competitive games, focusing on fun and experimentation without the pressure of ranked progression.",
    },
    {
        mode: "co-op",
        description:
            "Co-op Mode lets players team up against AI opponents, focusing on strategic collaboration and teamwork to overcome increasingly challenging scenarios together.",
    },
];

onMounted(async () => {
    timerUpdateId = window.setInterval(updateSearchTime, 500);
    updateSearchTime();
    await fetchLatestQueues();
});

onUnmounted(async () => {
    clearInterval(timerUpdateId);
    await fetchLatestQueues();
});

const fetchLatestQueues = async () => {
    // Clear stored data
    playlistGroups.value.splice(0);
    actualPlaylists.value.splice(0);
    fetchingPlaylists.value = true;

    // Fetch data from the server, currently we'll always populate dummy data but only actually let people search against real queues.
    const listResponse: MatchmakingListOkResponse = await api.comms.request("matchmaking/list");

    const rankedPlaylistGroup: PlaylistGroup = { identifier: "ranked", playLists: [] };
    const casualPlaylistGroup: PlaylistGroup = { identifier: "casual", playLists: [] };
    const coopPlaylistGroup: PlaylistGroup = { identifier: "co-op", playLists: [] };

    if (listResponse.status === "success") {
        // For now until we can perhaps get some categorization of playlists, assume they all exist in the ranked or casual based on ranked
        listResponse.data.playlists.forEach((playList) => {
            actualPlaylists.value.push(playList);
            if (playList.ranked) {
                rankedPlaylistGroup.playLists.push({ key: playList.id, name: playList.name });
            } else {
                casualPlaylistGroup.playLists.push({ key: playList.id, name: playList.name });
            }
        });
    }

    // For now till we have more lists and an assumption that we want to categorize them, just add fake data to spark debate.
    if (rankedPlaylistGroup.playLists.length == 0) {
        rankedPlaylistGroup.playLists = [
            { key: "ranked/1v1", name: "1v1" },
            { key: "ranked/2v2", name: "2v2" },
            { key: "ranked/3v3", name: "3v3" },
            { key: "ranked/4v4", name: "4v4" },
        ];
    }
    playlistGroups.value.push(rankedPlaylistGroup);

    if (casualPlaylistGroup.playLists.length == 0) {
        casualPlaylistGroup.playLists = [
            { key: "casual/1v1", name: "1v1" },
            { key: "casual/2v2", name: "2v2" },
            { key: "casual/3v3", name: "3v3" },
            { key: "casual/4v4", name: "4v4" },
        ];
    }
    playlistGroups.value.push(casualPlaylistGroup);

    if (coopPlaylistGroup.playLists.length == 0) {
        coopPlaylistGroup.playLists = [
            { key: "co-op/vs-ai", name: "Players vs AI" },
            { key: "co-op/raptors", name: "Raptors" },
            { key: "co-op/scavengers", name: "Scavengers" },
        ];
    }
    playlistGroups.value.push(coopPlaylistGroup);

    fetchingPlaylists.value = false;
};

const onTapPlaylist = (playList) => {
    const index = selectedPlaylists.value.indexOf(playList);
    index === -1 ? selectedPlaylists.value.push(playList) : selectedPlaylists.value.splice(index, 1);
};

const onTapQueue = () => {
    api.session.matchmakingState.startQueue(actualSelectedPlaylists.value);
};

const onTapStopQueue = () => {
    api.session.matchmakingState.stopQueue();
};

const updateSearchTime = () => {
    // Bail if no current state;
    if (api.session.matchmakingState.state.value == "none") return;

    // Get the difference in milliseconds
    const curTime = new Date();

    const diffInMs = Math.abs(curTime.getTime() - api.session.matchmakingState.searchTimeStart.value.getTime());

    const diffInSeconds = diffInMs / 1000;

    // Get minutes and seconds
    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = Math.round(diffInSeconds % 60);

    // Pad minutes and seconds with leading zero if necessary
    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(seconds).padStart(2, "0");

    displayedTimeSearching.value = `${formattedMinutes}:${formattedSeconds}`;
};

watch(selectedMode, () => {
    selectedPlaylists.value.splice(0);
});

const isMatchMaking = computed(() => {
    return api.session.matchmakingState.state.value != "none";
});

const queuedPlaylists = computed(() => {
    return api.session.matchmakingState.searchedPlaylists.value;
});

const actualSelectedPlaylistIds = computed(() => {
    return selectedPlaylists.value.filter((playlist) => actualPlaylists.value.some((fetchedPlaylist) => fetchedPlaylist.id == playlist));
});

const actualSelectedPlaylists = computed(() => {
    return actualPlaylists.value.filter((playlist) => selectedPlaylists.value.includes(playlist.id));
});

const activeQueueGroup = computed(() => {
    return playlistGroups.value.find((group) => group.identifier == selectedMode.value);
});

const activeDescription = computed(() => {
    return modeDescriptions.find((group) => group.mode == selectedMode.value);
});

const usersInQueue = computed(() => {
    return api.session.matchmakingState.usersInMyQueue.value;
});

watch(isMatchMaking, (newVal: boolean) => {
    if (newVal) updateSearchTime();
});
</script>

<style lang="scss" scoped>
.card-height {
    height: 240px;
    min-width: 200px;
}
</style>
