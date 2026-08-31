export default function AboutPage() {
  return (
    <div className="about narrow-content">
      <details open className="about__section">
        <summary>General</summary>
        <div className="about__section-body">
          <p>
            <strong>
              Local jurisdictions are putting forward solutions to the global problem of climate
              change through Climate Action Plans.
            </strong>{' '}
            These documents strive to first quantify the greenhouse gas emissions within a
            city&apos;s scope of influence and then put forward strategies to reduce future
            emissions. The Bay Area Quality Management District{' '}
            <a href="https://www.baaqmd.gov">(Air District)</a> has provided formal guidance to
            assist jurisdictions in developing these plans. A key component of local
            jurisdictions&apos; greenhouse gas footprint is passenger vehicle travel. There is,
            however, no obvious approach to allocating the responsibility of the GHG from vehicle
            travel to individual jurisdictions. Several entities have put forward suggestions for
            how to approach this allocation, some of which the Air District notes in the guidance
            referenced above. The purpose of this data portal is to quickly and easily deliver
            consistent, jurisdiction-specific estimates of vehicle miles traveled. Importantly,
            this data is consistent with the travel outcomes associated with the Metropolitan
            Transportation Commission&apos;s long-range transportation plan, which meets a
            state-mandated GHG reduction target.
          </p>
          <iframe
            width="500"
            height="315"
            src="https://www.youtube.com/embed/fTG_xdCqpIo"
            title="Climate Action Plan VMT Data Portal overview"
            allowFullScreen
          />
        </div>
      </details>

      <details className="about__section">
        <summary>VMT Calculation and Methodology</summary>
        <div className="about__section-body">
          <p>
            <strong>
              The <a href="https://mtc.ca.gov">Metropolitan Transportation Commission</a>, or MTC,
              is the transportation planning, financing and coordinating agency for the
              nine-county San Francisco Bay Area.
            </strong>{' '}
            As part of their work MTC deploys and maintains a large-scale simulation model of
            daily travel behavior to support its regional transportation planning efforts, most
            notably in the regional transit document{' '}
            <a href="https://www.planbayarea.org">Plan Bay Area</a>.
          </p>
          <p>
            The model simulates transportation activities that the average household currently
            living in (for simulations of historical years), or expected to be living in (for
            simulations of future years), in the nine-county Bay Area. The model is documented in
            great detail on this{' '}
            <a href="https://github.com/BayAreaMetro/modeling-website/wiki/TravelModel">webpage</a>{' '}
            and the implementation scripts are shared and maintained on{' '}
            <a href="https://github.com/BayAreaMetro/travel-model-one">GitHub</a>. The Data Portal
            summaries are drawn from the same model output that informs MTC&apos;s regional
            transportation plan and sustainable communities strategy. Therefore, the data is
            consistent with the travel data used in preparing regional plans to address
            transportation and land use, air quality, and greenhouse gases. The simulation
            involves the prediction of numerous travel-related outcomes, including:
          </p>
          <ul>
            <li>where the household is located;</li>
            <li>the location of employment of workers in the household and where the students go to school;</li>
            <li>the time during which workers work, students go to school;</li>
            <li>the time and location in which individuals engage in other, non-work and non-school, activities;</li>
            <li>the means by which travelers get around (e.g., walk, drive, take the bus);</li>
            <li>and, the routes travelers take to get around (e.g., I-80 to Mission Boulevard, the #1 bus).</li>
          </ul>

          <p>Two important notes are as follows:</p>
          <ol>
            <li>
              The model attempts to simulate a &quot;typical&quot; weekday, defined as a weekday
              when school is in session, the weather is good, and no major accidents or
              construction activities are taking place on the roadway.
            </li>
            <li>
              The travel model operates an abstracted spatial system: rather than moving between
              two precise locations, travelers move between what we call &quot;travel analysis
              zones&quot;. In MTC&apos;s current travel model, the travel analysis zones are
              similar in size to Census tracts. We assume that a traveler going to a travel
              analysis zone could be going to any precise location within the travel analysis
              zone&apos;s boundaries.
            </li>
          </ol>

          <p>
            One of the outputs of the simulation is a detailed record of every trip made by every
            simulated traveler. We define a &quot;trip&quot; as a movement between two locations
            where travelers engage in activities, e.g. from home to work, from school to the
            grocery store. The trip records include the trip&apos;s means of travel and travel
            distance as well as the traveler&apos;s home and work locations. This output can be
            used to create the data presented in the Climate Action Plan Vehicle Miles Traveled
            Data Portal. This is done via the following steps:
          </p>
          <ul>
            <li>define the subject geography, i.e. the city or county;</li>
            <li>identify the simulated travelers that live in the subject geography;</li>
            <li>identify the simulated travelers that work in the subject geography;</li>
            <li>
              compute the VMT for each simulated trip, which is simply the distance traveled in a
              distance divided by the number of travelers in the vehicle (if three travelers are
              in the vehicle, the movement is listed three times in the trip file);
            </li>
            <li>identify trips that begin in the subject geography;</li>
            <li>identify trips that end in the subject geography;</li>
            <li>
              and, sum the vehicle miles traveled by the six live/work market segments and the
              three start/end travel segments shown in the Data Portal summaries.
            </li>
          </ul>

          <p>
            These data summaries include only non-commercial travel. Meaning, it does not include
            travel made by taxi drivers, plumbers, etc., or for moving goods/freight.
          </p>

          <p>Three key caveats are as follows:</p>
          <ol>
            <li>
              Our simulation model explicitly assumes that every worker living in the nine-county
              Bay Area also works in the nine-county Bay Area. This is, of course, not always
              true, particularly in areas at the boundary of our planning region (e.g., Dixon).
              This caveat should be kept in mind when examining the results for jurisdictions near
              the boundary of our planning area.
            </li>
            <li>
              The data is simulated: we are using models to predict where people live and how
              they get around. The models are based on observations collected at different points
              in time and are routinely reviewed by State and Federal entities. We believe the
              data is robust and useful for informing Climate Action Plans &mdash; but it is
              simulated, not observed.
            </li>
            <li>
              The land use allocations used by MTC likely differ from those used by the county
              Congestion Management Agencies. Specifically, when doing sub-regional planning, MTC
              &mdash; in the Congestion Management Plan context &mdash; allows counties to
              re-allocate land use within their counties to different locations. There may,
              therefore, be minor inconsistencies between regional outcomes of the types presented
              in the Data Portal estimated by MTC and county outcomes estimated by Congestion
              Management Agencies. The Congestion Management Agencies may also use different
              travel modeling tools.
            </li>
          </ol>
        </div>
      </details>

      <details className="about__section">
        <summary>Frequently Asked Questions</summary>
        <div className="about__section-body about__faq">
          <details>
            <summary>What is this tool?</summary>
            <p>
              Funded by the Bay Area Air Quality Management District (Air District) in a
              collaboration between Air District and Metropolitan Transportation Commission
              (MTC). With the purpose of helping communities streamline the download of data,
              updating of greenhouse gas (GHG) inventories and to provide technical assistance to
              local governments.
            </p>
          </details>

          <details>
            <summary>What is a Climate Action Plan?</summary>
            <p>
              A climate action plan (CAP) is a community-wide GHG reduction policy document. CAPs
              may also address adaptation measures for adjusting to a changing climate. CAPs
              include a GHG target, an inventory of GHG sources in the community and a
              comprehensive strategy to meet the target.
            </p>
          </details>

          <details>
            <summary>Why do you use Vehicle Miles Traveled (VMT) when preparing Climate Action Plans?</summary>
            <p>
              VMT is important for calculating greenhouse gases (GHG) associated with the
              transportation section of a CAP. VMT calculations provided by a local transit
              planning organization such as the Bay Area&apos;s Metropolitan Transportation
              Commission (MTC) can be useful to align CAPs with regional transit plans such as
              Plan Bay Area.
            </p>
          </details>

          <details>
            <summary>How should Bay Area jurisdictions use this site to assist with developing a Climate Action Plan?</summary>
            <p>
              Jurisdictions in the Bay Area will find this site useful for developing and updating
              their GHG inventories, climate planning activities, tracking progress and
              understanding their community within the context of the Bay Area. This site
              provides the VMT data which can be used to determine a large portion of the GHG
              emissions from the transportation sector.
            </p>
          </details>

          <details>
            <summary>What methodology was used to determine vehicle miles traveled by jurisdiction?</summary>
            <p>
              Review the VMT Calculation and Methodology approach located on the About section of
              the VMT Data Portal website.
            </p>
          </details>

          <details>
            <summary>How do you download data from this site?</summary>
            <p>
              Data can be obtained from this site by clicking the Data link located in the
              Navigation banner of this website. To view the data in the browser, users must
              choose a Scenario year and a jurisdiction. In order to download data, users must
              select the Download Data button located in the data preview panel. Data is
              downloaded as a CSV file, and can be used in Excel or other spreadsheet programs.
            </p>
          </details>

          <details>
            <summary>What is a CSV file?</summary>
            <p>
              CSV stands for comma separated values. See this{' '}
              <a href="https://en.wikipedia.org/wiki/Comma-separated_values">link</a> for more
              detail on what a CSV file is, and how it is used to store data in a tabular format.
            </p>
          </details>

          <details>
            <summary>
              When using the MacOS Safari Browser or Windows IE web browser, the download data
              option does not work. What should I do?
            </summary>
            <p>
              Unfortunately, these two web browsers handle csv files differently than other
              browsers. We suggest you use another popular web browser like Mozilla&apos;s
              Firefox, or Google&apos;s Chrome Browser.
            </p>
          </details>

          <details>
            <summary>What is the difference between a Place Boundary and a TAZ Boundary?</summary>
            <p>
              Place geography used by this tool is provided and maintained by the U.S. Census
              Bureau. This geography includes both Incorporated Places and Census Designated
              Places (CDPs). Transportation Analysis Zones (TAZs) are the basic geographic unit
              used for modeling travel behavior within a Metropolitan Planning Organization&apos;s
              (MPO) boundaries. TAZ boundaries are largely defined by population size. Because of
              this, a Place boundary is typically larger than a TAZ boundary in very densely
              populated areas, and conversely, in low density or rural areas, TAZ boundaries can
              be larger than Place boundaries. There are 101 Incorporated Places, 60 CDPs and 1454
              TAZs within the nine-county bay region.
            </p>
            <p>
              Resources for more information on:
              <br />
              <a href="https://www.census.gov/geo/reference/gtc/gtc_place.html">CDP</a>
              <br />
              <a href="https://www.fhwa.dot.gov/planning/tmip/publications/other_reports/technical_synthesis_report/page01.cfm">
                TAZ
              </a>
              <br />
              <a href="https://www.census.gov/geo/reference/gtc/gtc_place.html">CDP vs. TAZ</a>
            </p>
          </details>

          <details>
            <summary>Where can I download the entire VMT dataset for all Places within the nine-county Bay Area region?</summary>
            <p>
              The Metropolitan Transportation Commission (MTC) maintains a data set that hosts the
              VMT data by Place for the nine-county Bay Area, click{' '}
              <a href="https://bayareametro.github.io/capvmt_v2.0/">here</a> to get more
              information.
            </p>
          </details>

          <details>
            <summary>What happens after I submit Feedback to this site?</summary>
            <p>
              Feedback is vital to the success of this tool, and we welcome any and all feedback
              that our users wish to provide. We periodically review feedback in an effort to fix
              software bugs, answer technical questions about the website, and enhance the website
              with future improvements that our users request. All submitted feedback is stored
              and maintained by this website repository and can be viewed by clicking this{' '}
              <a href="https://github.com/BayAreaMetro/CAPVMT/issues">link</a>.
            </p>
          </details>

          <details>
            <summary>Not all of the features are available when I try to view this website on my mobile device.</summary>
            <p>
              This site is best viewed using a Tablet, Laptop or Desktop device. Mobile devices
              are typically restricted from downloading directly to the device. Therefore, this
              website does not allow users to download data when using a mobile device such as a
              smart phone.
            </p>
          </details>
        </div>
      </details>
    </div>
  );
}
