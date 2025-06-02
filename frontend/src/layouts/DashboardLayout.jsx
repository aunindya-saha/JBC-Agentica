import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
    return(
        <div>
            <Outlet />
            <footer>
                Footer
            </footer>
        </div>
    )
}