import { Static } from "@sinclair/typebox";
import { assign } from "jaz-ts-utils";
import { PrivateUser, SuccessResponseData } from "tachyon-protocol";
import { computed, ComputedRef, nextTick, reactive, Ref, ref, shallowReactive, shallowRef } from "vue";

import { OfflineBattle } from "@/model/battle/offline-battle";
import { SpadsBattle } from "@/model/battle/spads-battle";
import { Message } from "@/model/messages";
import { CurrentUser, User } from "@/model/user";

export class SessionAPI {
    public readonly offlineMode: Ref<boolean> = ref(false);
    public readonly offlineBattle: Ref<OfflineBattle | null> = shallowRef(null);
    public readonly onlineBattle: Ref<SpadsBattle | null> = shallowRef(null);
    public readonly users: Map<number, User> = reactive(new Map<number, User>([]));
    public readonly offlineUser: CurrentUser;
    public readonly onlineUser: CurrentUser;
    public readonly battles: Map<number, SpadsBattle> = shallowReactive(new Map<number, SpadsBattle>());
    public readonly battleMessages: Message[] = reactive([]);
    public readonly serverStats: Ref<SuccessResponseData<"system", "serverStats"> | null> = shallowRef(null);
    public readonly outgoingFriendRequests: ComputedRef<User[]>;
    public readonly incomingFriendRequests: ComputedRef<User[]>;
    public readonly friends: ComputedRef<User[]>;
    public readonly directMessages: Map<number, Message[]> = reactive(new Map());

    constructor() {
        // TODO: remove class initialisers, do everything in clear function, then call this.clear() from this constructor, and also call .clear() on logout
        this.offlineMode.value = false;
        this.offlineBattle.value = null;
        this.onlineBattle.value = null;
        this.users.clear();
        this.battles.clear();
        this.battleMessages.length = 0;
        this.serverStats.value = null;
        this.directMessages.clear();

        const userData: CurrentUser = {
            userId: -1,
            username: "Player",
            isBot: false,
            icons: {},
            clanId: null,
            countryCode: "",
            permissions: new Set([]),
            friendUserIds: new Set([]),
            incomingFriendRequestUserIds: new Set([]),
            outgoingFriendRequestUserIds: new Set([]),
            ignoreUserIds: new Set([]),
            isOnline: true,
            battleStatus: {
                inBattle: false,
                away: false,
                battleId: -1,
                ready: false,
                isSpectator: false,
                sync: {
                    engine: 1,
                    game: 1,
                    map: 1,
                },
                color: "",
                teamId: 0,
                playerId: 0,
            },
        };

        this.offlineUser = reactive(userData);

        this.onlineUser = reactive(userData);

        this.outgoingFriendRequests = computed(() => [...this.onlineUser.outgoingFriendRequestUserIds].map((id) => this.getUserById(id)!).filter(Boolean));
        this.incomingFriendRequests = computed(() => [...this.onlineUser.incomingFriendRequestUserIds].map((id) => this.getUserById(id)!).filter(Boolean));
        this.friends = computed(() => [...this.onlineUser.friendUserIds].map((id) => this.getUserById(id)!).filter(Boolean));
    }

    public clear() {
        // TODO
    }

    public updateCurrentUser(myUserData: PrivateUser) {
        this.users.set(myUserData.accountId, this.onlineUser);

        const user = this.updateUser(myUserData);

        assign(this.onlineUser, {
            ...user,
            incomingFriendRequestUserIds: new Set(myUserData.friend_requests),
            ignoreUserIds: new Set([]), // TODO
            permissions: new Set(myUserData.permissions),
            friendUserIds: new Set(myUserData.friends),
        });

        this.offlineUser.username = user.username;
        this.offlineUser.countryCode = user.countryCode; // TODO: temp hack because server schema changed and I'm lazy
        this.offlineUser.icons = user.icons;
    }

    public updateUser(userData: User) {
        let user = this.getUserById(userData.id);

        if (!user) {
            user = reactive({
                userId: userData.id,
                username: userData.name,
                clanId: userData.clan_id,
                isBot: userData.bot,
                countryCode: userData.country,
                icons: {},
                isOnline: false,
                battleStatus: {
                    inBattle: false,
                    away: false,
                    battleId: -1,
                    ready: false,
                    isSpectator: false,
                    sync: {
                        engine: 1,
                        game: 1,
                        map: 1,
                    },
                    color: "",
                    teamId: 0,
                    playerId: 0,
                },
            });
        }

        this.users.set(user.userId, user);

        user.userId = userData.id;
        user.username = userData.name;
        user.clanId = userData.clan_id;
        user.isBot = userData.bot;
        user.countryCode = userData.country;
        user.icons = userData.icons;

        return user;
    }

    public updateUserBattleStauts(battleStatusData: Static<typeof playerSchema>) {
        const user = this.getUserById(battleStatusData.userid);
        if (!user) {
            throw new Error(`Tried to update battle status for an unknown user: ${battleStatusData.userid}`);
        }

        user.battleStatus.away = battleStatusData.away;
        user.battleStatus.battleId = battleStatusData.lobby_id;
        user.battleStatus.inBattle = battleStatusData.in_game;
        user.battleStatus.isSpectator = !battleStatusData.player;
        user.battleStatus.sync = battleStatusData.sync;
        user.battleStatus.teamId = battleStatusData.team_number;
        user.battleStatus.playerId = battleStatusData.player_number;
        user.battleStatus.color = battleStatusData.team_colour;
        user.battleStatus.ready = battleStatusData.ready;

        user.isOnline = true;
    }

    public getUserById(userId: number) {
        const user = this.users.get(userId);
        return user;
    }

    public getUserByName(username: string) {
        for (const user of this.users.values()) {
            if (user.username === username) {
                return user;
            }
        }

        return undefined;
    }

    public async fetchUserById(userId: number): Promise<User> {
        const user = this.getUserById(userId);
        if (user) {
            return user;
        }
        await api.comms.request("c.user.list_users_from_ids", { id_list: [userId], include_clients: true });
        await nextTick();
        return this.fetchUserById(userId);
    }

    public async updateBattleList() {
        const { lobbies } = await api.comms.request("c.lobby.query", { query: {}, fields: ["lobby", "bots", "modoptions", "member_list"] });

        const userIds: number[] = [];
        for (const battle of lobbies.map((data) => data.lobby)) {
            userIds.push(...battle.players);
            userIds.push(battle.founder_id);
        }

        await api.comms.request("c.user.list_users_from_ids", { id_list: userIds, include_clients: true });

        for (const lobby of lobbies) {
            const battle = api.session.battles.get(lobby.lobby.id);
            if (!battle) {
                api.session.battles.set(lobby.lobby.id, new SpadsBattle(lobby));
            } else {
                battle.handleServerResponse(lobby);
            }
        }

        // clear up dead battles
        const lobbyIds = lobbies.map((lobby) => lobby.lobby.id);
        api.session.battles.forEach((battle) => {
            if (!lobbyIds.includes(battle.battleOptions.id)) {
                api.session.battles.delete(battle.battleOptions.id);
            }
        });
    }
}
