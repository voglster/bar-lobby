<route lang="json5">
{ meta: { title: "Matchmaking", order: 0, devOnly: true, availableOffline: false, transition: { name: "slide-left" } } }
</route>

<template>
    <div>
        <h2>Modes</h2>
        <Divider />
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
        <Divider />
        <Transition>
            <div class="flex-row flex-wrap gap-md" v-if="activeQueueGroup != null">
                <TransitionGroup>
                    <Card v-for="(playlist, innerIndex) in activeQueueGroup.playLists">{{ playlist }}</Card>
                </TransitionGroup>
            </div>
        </Transition>
        <Transition>
            <div v-if="activeDescription">
                {{ activeDescription.description }}
            </div>
        </Transition>
    </div>
</template>

<script lang="ts" setup>
import rankedImage from "@/assets/images/backgrounds/1.png";
import casualImage from "@/assets/images/backgrounds/2.jpg";
import raptorsImage from "@/assets/images/backgrounds/3.png";
import scavImage from "@/assets/images/backgrounds/5.jpg";

import { MatchmakingListOkResponseData } from "tachyon-protocol/types";
import { reactive, Ref, ref, onMounted, computed } from "vue";

import Card from "@/components/common/Card.vue";
import Button from "@/components/controls/Button.vue";
import Divider from "@/components/common/Divider.vue";
import ToggleButton from "@/components/controls/ToggleButton.vue";
import Playerlist from "@/components/battle/Playerlist.vue";

interface SubPlaylist {
    playlistRoot: Ref<"none" | "ranked" | "casual" | "co-op">;
    playLists: Array<string>;
}

const selectedMode = ref<"none" | "ranked" | "casual" | "co-op">("none");
const queueGroups = ref<Array<SubPlaylist>>([] as Array<SubPlaylist>);

const modeDescriptions = [
    {
        mode: "none",
        description: "Please select a mode to play",
    },
    {
        mode: "ranked",
        description: "You've selected ranked",
    },
    {
        mode: "casual",
        description: "You've selected casual",
    },
    {
        mode: "co-op",
        description: "You've selected co-op",
    },
];

onMounted(async () => {
    queueGroups.value.push({ playlistRoot: "ranked", playLists: ["1v1", "2v2", "3v3", "4v4"] });
    queueGroups.value.push({ playlistRoot: "casual", playLists: ["Casual 1v1", "Casual 2v2", "Casual 3v3", "Casual 4v4"] });
    queueGroups.value.push({ playlistRoot: "co-op", playLists: ["vs AI", "Scavengers", "Raptors"] });
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
