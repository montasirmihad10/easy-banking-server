import { Router } from "express";
import { userRoutes } from "../modules/User/user.route";
import { authRoutes } from "../modules/Auth/auth.route";
import { accountRoutes } from "../modules/Account/account.route";
import { branchRoutes } from "../modules/Branches/branch.route";
import { transactionRoutes } from "../modules/Transactions/transaction.route";
import { loanRoutes } from "../modules/Loan/loan.route";
import { typeRoutes } from "../modules/AccountTypes/type.route";
import { statRoutes } from "../modules/Admin-Customer-Stats/stats.route";
import { settingsRoutes } from "../modules/Settings/settings.route";
import { PrivacyRoutes } from "../modules/Settings/privacy/Privacy.route";
import { TermsRoutes } from "../modules/Settings/Terms/Terms.route";
import { AboutRoutes } from "../modules/Settings/About/About.route";
import { notificationRoutes } from "../modules/Notification/notification.route";
import { supportRoutes } from "../modules/Support/support.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/account",
    route: accountRoutes,
  },
  {
    path: "/branch",
    route: branchRoutes,
  },
  {
    path: "/transaction",
    route: transactionRoutes,
  },
  {
    path: "/loan",
    route: loanRoutes,
  },
  {
    path: "/type",
    route: typeRoutes,
  },
  {
    path: "/stats",
    route: statRoutes,
  },
  {
    path: "/settings",
    route: settingsRoutes,
  },
  {
    path: "/settings/privacy",
    route: PrivacyRoutes,
  },
  {
    path: "/settings/terms",
    route: TermsRoutes,
  },
  {
    path: "/settings/about",
    route: AboutRoutes,
  },
  {
    path: "/notifications",
    route: notificationRoutes,
  },
  {
    path: "/notification",
    route: notificationRoutes,
  },
  {
    path: "/support",
    route: supportRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

// router.use("/students", StudentRoutes);
// router.use("/users", UserRoutes);

export default router;
