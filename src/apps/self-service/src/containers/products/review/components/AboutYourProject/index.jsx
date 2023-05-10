import { HelpBanner } from "../../../../../components/banners";
import { PageUl } from "../../../../../components/page-elements";

const AboutYourProject = () => {
  return (
    <HelpBanner
      styles={["turqoise"]}
      title="Important things to know about your project"
    >
      <PageUl>
        <li>
          <strong>
            Your Dashboard is your go-to hub for managing your work.
          </strong>
          &nbsp; From here you can view timelines, details, and other important
          information tied to your work submissions.
        </li>
        <li>
          <strong>
            You can expect members of our community to ask you questions about
            this work.
          </strong>
          &nbsp; From your Work Summary page you’ll see if you have any
          outstanding Messages, indicated by a red icon. Please answer questions
          from our members in a timely and thorough manner. This will help them
          deliver high quality results for you on time!
        </li>
        <li>
          <strong>
            Topcoder experts will curate the best solutions for you.
          </strong>
          &nbsp; This saves you time and energy wading through submissions that
          perhaps aren't of value to you. When your high-quality submissions are
          ready, you'll be notified to download your assets, rate your Topcoder
          experience, and officially close out this work.
        </li>
      </PageUl>
    </HelpBanner>
  );
};

export default AboutYourProject;
