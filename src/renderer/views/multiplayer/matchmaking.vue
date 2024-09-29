<route lang="json5">
{ meta: { title: "Matchmaking", order: 0, devOnly: true, availableOffline: false, transition: { name: "slide-left" } } }
</route>

<template>
    <div class="flex-col gap-md flex-grow">
        <h2>Modes</h2>
        <div class="flex-row flex-wrap gap-xl">
            <Card
                :is-selected="selectedMode == 'ranked'"
                v-on:on-click="selectedMode != 'ranked' ? (selectedMode = 'ranked') : (selectedMode = 'none')"
                class="card-height flex-grow"
                :background-img-url="rankedImage"
                style-type="cover"
                title="Ranked"
            >
                <p>Compete in structured matches to earn points and improve your rank.</p>
            </Card>
            <Card
                :is-selected="selectedMode == 'casual'"
                v-on:on-click="selectedMode != 'casual' ? (selectedMode = 'casual') : (selectedMode = 'none')"
                class="card-height flex-grow"
                :background-img-url="casualImage"
                style-type="cover"
                title="Casual"
            >
                <p>Enjoy relaxed matches without pressure.</p>
            </Card>
            <Card
                :is-selected="selectedMode == 'co-op'"
                v-on:on-click="selectedMode != 'co-op' ? (selectedMode = 'co-op') : (selectedMode = 'none')"
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
                        v-on:on-click="onTapPlaylist(playlist.key)"
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

        <div class="flex-row flex-grow flex-align-end flex-justify-end">
            <h4><Card v-on:on-click="onTapQueue" :disabled="selectedPlaylists.length == 0">Play</Card></h4>
        </div>
    </div>
</template>

<script lang="ts" setup>
import rankedImage from "@/assets/images/backgrounds/1.png";
import casualImage from "@/assets/images/backgrounds/2.jpg";
import raptorsImage from "@/assets/images/backgrounds/3.png";
import scavImage from "@/assets/images/backgrounds/5.jpg";

import { MatchmakingListOkResponseData } from "tachyon-protocol/types";
import { reactive, Ref, ref, onMounted, computed, watch } from "vue";

import Card from "@/components/common/Card.vue";
import Button from "@/components/controls/Button.vue";
import Divider from "@/components/common/Divider.vue";
import ToggleButton from "@/components/controls/ToggleButton.vue";
import Playerlist from "@/components/battle/Playerlist.vue";

interface PlaylistGroup {
    playlistRoot: Ref<"none" | "ranked" | "casual" | "co-op">;
    playLists: Array<PlayListGroupItem>;
}

interface PlayListGroupItem {
    key: string;
    name: string;
}

const selectedMode = ref<"none" | "ranked" | "casual" | "co-op">("none");
const queueGroups = ref<Array<PlaylistGroup>>([] as Array<PlaylistGroup>);
const selectedPlaylists = ref<Array<string>>([] as Array<string>);

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
    queueGroups.value.push({
        playlistRoot: "ranked",
        playLists: [
            { key: "ranked/1v1", name: "1v1" },
            { key: "ranked/2v2", name: "2v2" },
            { key: "ranked/3v3", name: "3v3" },
            { key: "ranked/4v4", name: "4v4" },
        ],
    });
    queueGroups.value.push({
        playlistRoot: "casual",
        playLists: [
            { key: "casual/1v1", name: "1v1" },
            { key: "casual/2v2", name: "2v2" },
            { key: "casual/3v3", name: "3v3" },
            { key: "casual/4v4", name: "4v4" },
        ],
    });
    queueGroups.value.push({
        playlistRoot: "co-op",
        playLists: [
            { key: "co-op/vs-ai", name: "Players vs AI" },
            { key: "co-op/raptors", name: "Raptors" },
            { key: "co-op/scavengers", name: "Scavengers" },
        ],
    });
});

const onTapPlaylist = (playList) => {
    const index = selectedPlaylists.value.findIndex((e) => e == playList);

    if (index == -1) {
        selectedPlaylists.value.push(playList);
    } else {
        selectedPlaylists.value.splice(index, 1);
    }
};

const onTapQueue = () => {
    console.log("Queue me baby", selectedPlaylists.value);
};

watch(selectedMode, () => {
    selectedPlaylists.value.splice(0);
});

const activeQueueGroup = computed(() => {
    return queueGroups.value.find((group) => group.playlistRoot == selectedMode.value);
});

const activeDescription = computed(() => {
    return modeDescriptions.find((group) => group.mode == selectedMode.value);
});
</script>

<style lang="scss" scoped>
.card-height {
    height: 240px;
    min-width: 200px;
}
</style>
