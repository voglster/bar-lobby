<template>
    <div>
        <div class="matchmaking-position">
            <Transition name="slide-right">
                <Card opaque v-if="queueing">
                    <div class="flex-col gap-sm">
                        <div class="flex-row">
                            <b>{{ queueState }}</b>
                        </div>
                        <div class="flex-row gap-sm">
                            <div v-for="(playlist, index) in queuedPlaylists" :key="index" class="flex-row">{{ playlist.name }}</div>
                        </div>
                        <div class="flex-row">
                            <div v-if="usersInQueue">{{ usersInQueue }} users in queue.</div>
                        </div>
                    </div>
                </Card>
            </Transition>
        </div>
        <Modal v-model="showReadyUpModal" title="Match Found" :persistent="true" @open="onOpen">
            <div class="flex-col gap-md modal-size">
                <div class="flex-row flex-right">{{ readyCount }} / {{ maxReadyCount }} Players ready</div>
                <div class="flex-row gap-lg flex-center-content">
                    <Card class="playerReadyIcon" v-for="n in maxReadyCount" :key="n">
                        <Icon :icon="readyAvatar" height="100%" :color="readyCount < n ? 'white' : 'green'" />
                    </Card>
                </div>
                <div v-if="!hasPlayerReadied" class="flex-row">Please ready up! {{ "$$" }} seconds left.</div>
                <div class="flex-row gap-md">
                    <Card @tap="onTapCancel" class="flex-grow flex-center-content">Cancel </Card>
                    <Card @tap="onTapReady" class="flex-grow flex-4 flex-center-content">Ready </Card>
                </div>
            </div>
        </Modal>
    </div>
</template>

<script lang="ts" setup>
import pulseAnim from "@/assets/images/icons/pulse-anim.svg?url";
import { computed, ref } from "vue";
import Card from "@/components/common/Card.vue";
import Modal from "@/components/common/Modal.vue";
import readyAvatar from "@iconify-icons/mdi/human-greeting-variant";
import { Icon } from "@iconify/vue";

const onOpen = () => {};

const onTapCancel = () => {
    api.session.matchmakingState.cancelReadyUp();
};

const onTapReady = () => {
    api.session.matchmakingState.readyUp();
};

const showReadyUpModal = computed(() => {
    return api.session.matchmakingState.state.value == "found" || api.session.matchmakingState.state.value == "readied";
});

const hasPlayerReadied = computed(() => {
    return api.session.matchmakingState.state.value == "readied";
});

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
    if (api.session.matchmakingState.usersReadyInFoundGroup == null) return 0;
    else return api.session.matchmakingState.usersReadyInFoundGroup.value as number;
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

.modal-size {
    min-width: 200px;
}

.playerReadyIcon {
    width: 80px;
    height: 80px;
}
</style>
