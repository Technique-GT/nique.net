import { createFileRoute } from "@tanstack/react-router";
import { AdminOnlyRoute } from "@/components/admin-only-route";
import Spotify from "@/features/stats-moderation/spotify";

export const Route = createFileRoute("/_authenticated/spotify/")({
    component: () => (
        <AdminOnlyRoute>
            <Spotify />
        </AdminOnlyRoute>
    ),
});
