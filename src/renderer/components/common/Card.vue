<template>
    <Card
        v-if="styleType == 'typical'"
        class="card-backing inset-content"
        :class="{ selected: isSelected, disabled: disabled, opaque: opaque }"
        @click="onClick"
    >
        <template #header v-if="headerImgUrl">
            <img alt="user header" :src="headerImgUrl" />
        </template>
        <template #title v-if="title">{{ title }}</template>
        <template #subtitle v-if="subTitle">{{ subTitle }}</template>
        <template #content>
            <slot></slot>
        </template>
    </Card>
    <Card
        v-else-if="styleType == 'cover'"
        class="card-backing"
        :class="{ selected: isSelected, disabled: disabled, opaque: opaque }"
        @click="onClick"
    >
        <template #content>
            <img class="back-image" :src="backgroundImgUrl" />
            <div class="inset-content cover-content flex-col flex-justify-end">
                <div v-if="headerImgUrl"><img alt="user header" :src="headerImgUrl" /></div>
                <h3 v-if="title">{{ title }}</h3>
                <h4 v-if="subTitle">{{ subTitle }}</h4>
                <slot></slot>
            </div>
            <div class="back-image faded-dark-gradient"></div>
        </template>
    </Card>
</template>

<script lang="ts" setup>
import Card from "primevue/card";

const props = withDefaults(
    defineProps<{
        isSelected?: boolean;
        headerImgUrl?: string;
        backgroundImgUrl?: string;
        title?: string;
        subTitle?: string;
        disabled?: boolean;
        opaque?: boolean;
        styleType?: "typical" | "cover";
    }>(),
    {
        isSelected: false,
        disabled: false,
        opaque: false,
        styleType: "typical",
    }
);

const emit = defineEmits<{
    (event: "tap"): void;
}>();

const onClick = (event) => {
    createRipple(event);
    emit("tap");
};

const createRipple = (event) => {
    const button = event.currentTarget;

    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;

    // Get the bounding rectangle of the button
    const rect = button.getBoundingClientRect();
    // Calculate the position of the ripple based on the button's position
    const left = event.clientX - rect.left - radius;
    const top = event.clientY - rect.top - radius;

    circle.style.left = `${left}px`;
    circle.style.top = `${top}px`;
    circle.classList.add("ripple");

    // Remove any existing ripple
    const existingRipple = button.getElementsByClassName("ripple")[0];
    if (existingRipple) {
        existingRipple.remove();
    }

    button.appendChild(circle);
};
</script>

<style lang="scss">
.container {
    position: relative;
    height: 100%;
    width: 100%;
    overflow: hidden;
}

.back-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -1;
    padding: 4px;
}

.disabled {
    color: gray !important;
    pointer-events: none !important;
    background: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.3)) !important;
    backdrop-filter: blur(10px) brightness(0) saturate(0) !important;
    border: 3px solid rgba(255, 255, 255, 0.05) !important;
}

.opaque {
    background: linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.9)) !important;
    backdrop-filter: blur(10px) brightness(1) saturate(2) !important;
    border: 3px solid rgba(255, 255, 255, 0.05) !important;
}

.card-backing {
    position: relative;
    display: flex;
    gap: 10px;
    overflow: hidden;
    background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6));
    backdrop-filter: blur(10px) brightness(1) saturate(2);
    border: 3px solid rgba(255, 255, 255, 0.2);
    border-top: 1px solid rgba(255, 255, 255, 0.3);
    border-bottom: 1px solid rgba(124, 124, 124, 0.3);
    box-shadow: -1px 0 0 rgba(0, 0, 0, 0.3), 1px 0 0 rgba(0, 0, 0, 0.3), 0 1px 0 rgba(0, 0, 0, 0.3), 0 -1px 0 rgba(0, 0, 0, 0.3),
        inset 0 0 50px rgba(255, 255, 255, 0.15), inset 0 3px 8px rgba(255, 255, 255, 0.1), 3px 3px 10px rgba(0, 0, 0, 0.8);
    z-index: 2;
    transition: background-color 0.3s, transform 0.3s;
}

.selected {
    border: 3px solid rgb(0, 174, 255) !important;
}

.card-backing:hover {
    background-color: #2980b9;
    transform: scale(1.05);
}

.inset-content {
    padding: 10px;
}

.cover-content {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
}

.faded-dark-gradient {
    background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5));
}

span.ripple {
    position: absolute;
    border-radius: 50%;
    transform: scale(0);
    animation: ripple 600ms linear;
    background-color: rgba(255, 255, 255, 0.3);
}

@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}
</style>
