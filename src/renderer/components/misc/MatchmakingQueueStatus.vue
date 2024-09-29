<template>
    <div class="matchmaking-position">
        <Transition name="slide-right">
            <Card opaque v-if="queueing">
                <div class="flex-col gap-sm">
                    <div class="flex-row">
                        <b>{{ queueState }}</b>
                    </div>
                    <div class="flex-row">Searching for a game...</div>
                    <div class="flex-row gap-sm">
                        <div v-for="(playlist, index) in queuedPlaylists" :key="index" class="flex-row">{{ playlist.name }}</div>
                    </div>
                    <div class="flex-row">
                        <div v-if="usersInQueue">{{ usersInQueue }} users in queue.</div>
                    </div>
                    <div class="flex-row">
                        <div v-if="readyCount">{{ readyCount }} / {{ maxReadyCount }} Ready.</div>
                    </div>
                </div>
            </Card>
        </Transition>
    </div>
    <!--<div :class="[`matchmaking-queue-status`, { visible: queueing }]">Searching for a game <img :src="pulseAnim" /></div>-->
</template>

<script lang="ts" setup>
import pulseAnim from "@/assets/images/icons/pulse-anim.svg?url";
import { computed } from "vue";
import Card from "@/components/common/Card.vue";

const queueing = computed(() => {
    return api.session.matchmakingState.state.value != "none";
});

const queueState = computed(() => {
    return api.session.matchmakingState.state.value;
});

const queuedPlaylists = computed(() => {
    return api.session.matchmakingState.searchedPlaylists.value;
});

const usersInQueue = computed(() => {
    return api.session.matchmakingState.usersInMyQueue.value;
});

const readyCount = computed(() => {
    return api.session.matchmakingState.usersReadyInFoundGroup.value;
});

const maxReadyCount = computed(() => {
    return api.session.matchmakingState.maxReadyCount.value;
});
</script>

<style lang="scss" scoped>
.matchmaking-position {
    position: absolute;
    top: 10px;
    right: -10px;
    z-index: 2;
}

.matchmaking-queue-status {
    background: #111;
    padding: 5px 10px;
    position: absolute;
    top: 10px;
    right: 0;
    z-index: 2;
    transform: translateX(100%);
    transition: transform 0.2s;
    &.visible {
        transform: translateX(0%);
    }
}
.searching-loader {
    position: absolute;
    top: 0;
    right: 0;
}
</style>
